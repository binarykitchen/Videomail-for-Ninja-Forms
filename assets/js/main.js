var VideomailClient = require('videomail-client')

// manual switch to have more stuff printed to console
var DEBUG = true

// good documentation on backbone event handling
// http://backbonejs.org/#Events

var VideomailFieldController = Marionette.Object.extend({

    videomailClient:    null,
    fieldModel:         null,
    formModel:          null,

    initialize: function() {
        Backbone.Radio.DEBUG = DEBUG

        // TODO do not load anything, nor do any event handling
        // when no fields are of type videomail
        // easy to reproduce: create a default contact form without
        // videomail and it's still loaded ...
        // see https://github.com/wpninjas/ninja-forms-videomail/issues/29

        var submitChannel    = Backbone.Radio.channel('submit')
        var videomailChannel = Backbone.Radio.channel('videomail')

        // Backbone Radio Listeners
        // see https://github.com/marionettejs/backbone.radio

        this.listenTo(
            videomailChannel,
            'init:model',
            this.registerFieldModel
        )

        this.listenTo(
            submitChannel,
            'init:model',
            this.registerSubmitModel
        )

        // Radio Responses, see http://developer.ninjaforms.com/codex/field-submission-data/
        videomailChannel.reply('get:submitData',     this.getSubmitData, this)
        videomailChannel.reply('validate:required',  this.validateRequired, this)

        // needed to validate when submitting
        videomailChannel.reply('validate:modelData', this.hasVideomail, this)
    },

    // is called every time a ‘videomail’ field is initialized
    // but since we only have one instance per form, it is okay to do it like that for
    // todo add new ninja form configuration to limit instances to 1
    registerFieldModel: function(videomailFieldModel) {
        this.fieldModel = videomailFieldModel
    },

    videomailClientLoaded: function() {
        return !!this.videomailClient
    },

    // called when submit button has been laid out internally
    registerSubmitModel: function(submitFieldModel) {

        // precaution: proceed only when not initialised yet otherwise
        // videomail client is loaded again after submission.
        //
        // can also be prevented in a form setting in the Advanced domain
        // of the form builder, under Display Settings,
        // that allows you to clear/hide the form after submission
        if (!this.videomailClientLoaded()) {

            var formID         = "form-" + submitFieldModel.get('formID')
            var submitButtonId = "nf-field-" + submitFieldModel.get('id')
            var formChannel    = Backbone.Radio.channel(formID)

            this.loadVideomailClient({submitButtonId: submitButtonId})

            formChannel.reply(
                'maybe:submit',
                this.maybeSubmit,
                this,
                formID
            )
        }
    },

    validateRequired: function() {
        var valid = this.hasVideomail()

        // override default behaviour so that we can set our own error text here
        if (!valid) {
            Backbone.Radio.channel('fields').request(
                'add:error',
                this.fieldModel.get('id'),
                'required-error',
                "Record and click on stop to see a preview video."
            )
        }

        return valid
    },

    // called when about to start a submission
    // how to stop a submission? see:
    // http://developer.ninjaforms.com/codex/startstop-submission/
    maybeSubmit: function(formModel) {
        // halt the normal ninja form submission by default
        var proceed = false

        // remember form model for some submission-related functions further below
        this.formModel = formModel

        if (this.formModel.getExtra('videomail_submitted')) {
            // yes, videomail is on the videomail server, so
            // proceed with the normal ninja form submission routine
            proceed = true
        } else {
            // manually trigger the whole videomail submission
            // we cant be using the submit button click event since it's too
            // deep wrapped within backbone containers :(
            this.videomailClient.submit()
        }

        return proceed
    },

    getOption: function(name, defaultOption) {
        // todo the this.fieldModel check is temporary until
        // https://github.com/wpninjas/ninja-forms-videomail/issues/29 is resolved
        return this.fieldModel && this.fieldModel.get(name) || defaultOption
    },

    loadVideomailClient: function(options) {
        this.videomailClient = new VideomailClient({
            siteName: this.getOption('site_name'),
            video: {
                limitSeconds:   this.getOption('limit_seconds', 80),
                width:          this.getOption('width', 320),
                countdown:      this.getOption('countdown', false)
            },
            selectors: {
                submitButtonId: options.submitButtonId
            },
            audio: {
                enabled: this.getOption('audio_enabled', false)
            },
            callbacks: {
                adjustFormDataBeforePosting:
                // ugly name eh?
                this.adjustFormDataBeforePostingToVideomailServer.bind(this)
            },
            // leave it to ninja form to validate the inputs
            enableAutoValidation: false,
            // log actions/events to console
            verbose: this.getOption('verbose', DEBUG)
        })

        // needed to get the videomail key which is required before submission
        this.videomailClient.on(
            this.videomailClient.events.PREVIEW,
            this.setVideomailKey.bind(this)
        )

        // needed to invalidate form
        this.videomailClient.on(
            this.videomailClient.events.GOING_BACK,
            this.removeVideomailKey.bind(this)
        )

        this.videomailClient.on(
            this.videomailClient.events.SUBMITTED,
            this.videomailSubmitted.bind(this)
        )

        this.videomailClient.show()
    },

    setVideomailKey: function(key) {
        this.fieldModel.set('videomail-key', key)

        Backbone.Radio.channel('fields').request(
            'remove:error',
            this.fieldModel.get('id'),
            'required-error'
        )
    },

    removeVideomailKey: function() {
        this.setVideomailKey(null)
    },

    getFormID: function() {
        return 'form-' + this.formModel.get('id')
    },

    hasVideomail: function() {
        var videomailKey = this.fieldModel.get('videomail-key')

        return !!videomailKey
    },

    getFieldValueByKey: function(key) {
        var field =
            Backbone.Radio.channel(this.getFormID())
                .request('get:fieldByKey', key)

        if (field) {
            return field.get('value')
        } else {
            // must have been a bad config from the user - in that case just do nothing
            return null
        }
    },

    getVideomailValue: function(fieldKey) {
        var fieldValue = this.fieldModel.get(fieldKey)
        var rawValue   = null

        // it can happen that the user has configured something wrong,
        // i.E. an empty email_from. in that case just ignore ...
        if (fieldValue) {
            // extract the key from the merge tag.
            // todo: make it work for i.E. {system:admin_email} as well, see
            // https://github.com/wpninjas/ninja-forms-videomail/issues/30
            rawValue = fieldValue.replace('{field:', '').replace('}', '')

            if (rawValue != fieldValue) {
                // yes it was a merge tag, so resolve it again
                rawValue = this.getFieldValueByKey(rawValue)
            }
        }

        return rawValue
    },

    adjustFormDataBeforePostingToVideomailServer: function(videomail, cb) {
        videomail.from    = this.getVideomailValue('email_from')
        videomail.to      = this.getVideomailValue('email_to')
        videomail.subject = this.getVideomailValue('email_subject')
        videomail.body    = this.getVideomailValue('email_body')

        cb(null, videomail)
    },

    videomailSubmitted: function(videomail) {
        // pass on some videomail attributes to the field model
        this.fieldModel.set('value', videomail.url)
        this.fieldModel.set('videomail-url', videomail.url)
        this.fieldModel.set('videomail-webm', videomail.webm)
        this.fieldModel.set('videomail-mp4', videomail.mp4)
        this.fieldModel.set('videomail-poster', videomail.poster)
        this.fieldModel.set('videomail-alias', videomail.alias)
        this.fieldModel.set('videomail-key', videomail.key)

        var formID = this.getFormID()

        // set re-videomail_submitted flag so that we can continue
        // with the normal ninja form submission
        Backbone.Radio.channel(formID).request('add:extra', 'videomail_submitted', true)

        // re-start submission
        Backbone.Radio.channel(formID).request('submit', this.formModel)
    },

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

    onBeforeDestroy: function() {
        this.videomailClient.unload()
    }
})

jQuery(document).ready(function() {
    new VideomailFieldController()
})