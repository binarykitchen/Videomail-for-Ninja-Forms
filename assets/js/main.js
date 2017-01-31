var VideomailClient = require('videomail-client')

// manual switch to have more stuff printed to console
var DEBUG = false;

// good documentation on backbone event handling
// http://backbonejs.org/#Events

var VideomailFieldController = Marionette.Object.extend({

    videomailClient:    null,

    initialize: function() {
        Backbone.Radio.DEBUG = DEBUG;

        // Listen to Videomail fieldModel `init`, before setting up Videomail-Client.
        this.listenTo( Backbone.Radio.channel( 'videomail' ), 'init:model', this.registerVideomailField );
    },

    registerVideomailField: function( fieldModel ){

        var formID = fieldModel.get( 'formID' );

        this.loadVideomailClient( fieldModel );

        // Custom field validation, since we aren't using a standard `value`.
        Backbone.Radio.channel( 'videomail'      ).reply( 'validate:required',  this.validateRequired,  this             );
        Backbone.Radio.channel( 'videomail'      ).reply( 'validate:modelData', this.validateVideomail, this             );

        // Pause submission so that we can POST to the Videomail server.
        Backbone.Radio.channel( 'form-' + formID ).reply( 'maybe:submit',       this.maybeSubmit,       this, fieldModel );

        // Append additional field data to the submission. By default, only `value` is sent.
        Backbone.Radio.channel( 'videomail'      ).reply( 'get:submitData',     this.getSubmitData,     this             );
    },

    /*
     * Load Videomail Client
     * Use the fieldModel's settings to init the Videomail Client.
     *
     * @param fieldModel
     */
    loadVideomailClient: function( fieldModel ) {
        this.videomailClient = new VideomailClient({
            siteName: fieldModel.get( 'site_name' ),
            video: {
                limitSeconds:   fieldModel.get( 'limit_seconds' ) || 80,
                width:          fieldModel.get( 'width' ) || 320,
                countdown:      fieldModel.get( 'countdown' ) || false,
            },
            audio: {
                enabled: fieldModel.get( 'audio_enabled' ) || false,
            },
            selectors: {
                submitButtonSelector: '.submit-container input[type="button"]'
            },
            // callbacks: {
            //     adjustFormDataBeforePosting:
            //     // ugly name eh?
            //     this.adjustFormDataBeforePostingToVideomailServer.bind(this)
            // },
            // leave it to ninja form to validate the inputs
            enableAutoValidation: false,
            // log actions/events to console
            verbose: fieldModel.get( 'verbose' ) || DEBUG
        });

        // needed to get the videomail key which is required before submission
        this.videomailClient.on( this.videomailClient.events.PREVIEW, function( key ){
            console.log( 'VIDEOMAIL: PREVIEW' );
            console.log( key );
            fieldModel.set( 'videomail-key', key );
            Backbone.Radio.channel('fields').request( 'remove:error', fieldModel.get('id'), 'required-error' ); // Clear any previous errors.
        });

        // needed to invalidate form
        this.videomailClient.on( this.videomailClient.events.GOING_BACK,function(){
            console.log( 'VIDEOMAIL: GOING BACK' );
        });

        this.videomailClient.on( this.videomailClient.events.SUBMITTED, function( videomail ){
            console.log( 'VIDEOMAIL: SUBMITTED' );
            console.log( videomail );
            console.log( fieldModel );
            // Restart Submission
            var formID = fieldModel.get( 'formID' );
            var formModel = nfRadio.channel( 'app' ).request( 'get:form', formID );
            
            // set a temporary videomail indicating that it has been submitted successfully
            nfRadio.channel( 'form-' + formModel.get( 'id' ) ).request( 'add:extra', 'generatedVideomail', videomail );
            nfRadio.channel( 'form-' + formID ).request( 'submit', formModel );
        });

        this.videomailClient.show()
    },

    /*
     * Validate Requried
     *
     * @channel videomail fieldType
     * @request validate:required
     */
    validateRequired: function( el, fieldModel ) {
        var valid = this.validateVideomail( fieldModel );

        // override default behaviour so that we can set our own error text here
        if (!valid) {
            Backbone.Radio.channel('fields').request(
                'add:error',
                fieldModel.get('id'),
                'required-error',
                "Record and click on stop to see a preview video."
            )
        }

        return valid
    },

    /*
     * Validate Videomail
     *
     * @channel videomail fieldType
     * @request validate:modelData
     * @param   fieldModel
     */
    validateVideomail: function( fieldModel ) {
        return fieldModel.get( 'videomail-key' ) || false;
    },

    /*
     * Maybe Submit
     *
     * @channel form-{formID}
     * @request maybe:submit
     * @param   formModel
     */
    maybeSubmit: function(formModel) {
        if ( ! formModel.getExtra( 'generatedVideomail' ) ) {
            this.videomailClient.submit();
            return false;
        }
        return true;
    },

    /*
     * Maybe Submit
     *
     * @channel videomail fieldType
     * @request get:submitData
     * @param   fieldData
     * @param   fieldModel
     */
    getSubmitData: function(fieldData, fieldModel) {
        fieldData.key       = fieldModel.get('videomail-key')
        fieldData.value     = fieldModel.get('videomail-url')
        fieldData.url       = fieldModel.get('videomail-url')
        fieldData.webm      = fieldModel.get('videomail-webm')
        fieldData.mp4       = fieldModel.get('videomail-mp4')
        fieldData.poster    = fieldModel.get('videomail-poster')
        fieldData.alias     = fieldModel.get('videomail-alias')

        return fieldData
    },

    // Removed for testing. -KBJ
    // videomailSubmitted: function(videomail) {
    //     // pass on some videomail attributes to the field model
    //     this.fieldModel.set('value', videomail.url)
    //     this.fieldModel.set('videomail-url', videomail.url)
    //     this.fieldModel.set('videomail-webm', videomail.webm)
    //     this.fieldModel.set('videomail-mp4', videomail.mp4)
    //     this.fieldModel.set('videomail-poster', videomail.poster)
    //     this.fieldModel.set('videomail-alias', videomail.alias)
    //     this.fieldModel.set('videomail-key', videomail.key)
    //
    //     var formID = this.getFormID()
    //
    //     // set re-videomail_submitted flag so that we can continue
    //     // with the normal ninja form submission
    //     `Backbone.Radio.channel(formID).request('add:extra', 'generatedVideomail', true)`
    //
    //     // re-start submission
    //     Backbone.Radio.channel(formID).request('submit', this.formModel)
    // },

    onBeforeDestroy: function() {
        this.videomailClient.unload()
    }
});

jQuery(document).ready(function() {
    new VideomailFieldController();
});
