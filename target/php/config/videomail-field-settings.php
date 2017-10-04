<?php

return apply_filters('ninja_forms_videomail_field_settings', array(

  'site_name' => array(
    'name' => 'site_name',
    'type' => 'textbox',
    'label' => __('Site Name ID', 'ninja-forms-videomail'),
    'width' => 'full',
    'group' => 'primary',
    'value' => 'ninja-forms-videomail-local',
    'help' => __('A valid site-name ID must be registered with the developer at www.videomail.io. The default one, ninja-forms-videomail-local, always works for local development/testing.', 'ninja-forms-videomail')
  ),

  'email_from' => array(
    'name' => 'email_from',
    'type' => 'textbox',
    'group' => 'primary',
    'label' => __('From', 'ninja-forms-videomail'),
    'placeholder' => __('Email address or search for a field', 'ninja-forms-videomail'),
    'value' => '',
    'width' => 'full',
    'use_merge_tags' => TRUE
  ),

  'email_to' => array(
    'name' => 'email_to',
    'type' => 'textbox',
    'group' => 'primary',
    'label' => __('To', 'ninja-forms-videomail'),
    'placeholder' => __('Email address or search for a field', 'ninja-forms-videomail'),
    'value' => '',
    'width' => 'full',
    'use_merge_tags' => TRUE
  ),

  'email_subject' => array(
    'name' => 'email_subject',
    'type' => 'textbox',
    'group' => 'primary',
    'label' => __('Subject', 'ninja-forms-videomail'),
    'placeholder' => __('Subject Text or search for a field', 'ninja-forms-videomail'),
    'value' => '',
    'width' => 'full',
    'use_merge_tags' => TRUE
  ),

  'email_body' => array(
    'name' => 'email_body',
    'type' => 'textbox',
    'group' => 'primary',
    'label' => __('Body', 'ninja-forms-videomail'),
    'placeholder' => __('Body Text or search for a field', 'ninja-forms-videomail'),
    'value' => '',
    'width' => 'full',
    'use_merge_tags' => TRUE
  ),

  'limit_seconds' => array(
    'name' => 'limit_seconds',
    'type' => 'number',
    'label' => __('Limit Recording (in Seconds)', 'ninja-forms-videomail'),
    'width' => 'full',
    'group' => 'restrictions',
    'value' => 80
  ),

  'audio_enabled' => array(
    'name' => 'audio_enabled',
    'type' => 'toggle',
    'label' => __('Enable Audio (in Beta)', 'ninja-forms-videomail'),
    'width' => 'full',
    'group' => 'restrictions',
    'value' => FALSE,
    'help' => __('The audio fetaure is in beta and needs feedback for improvement. Otherwise leave it disabled and stick to Sign Language, grins')
  ),

  'countdown' => array(
    'name' => 'countdown',
    'type' => 'number',
    'label' => __('Countdown Time', 'ninja-forms-videomail'),
    'width' => 'full',
    'group' => 'display',
    'value' => 3
  ),

  'width' => array(
    'name' => 'width',
    'type' => 'number',
    'label' => __('Video Width', 'ninja-forms-videomail'),
    'width' => 'full',
    'group' => 'display',
    'value' => 320
  ),

  'verbose' => array(
    'name' => 'verbose',
    'type' => 'toggle',
    'label' => __('Debug Mode', 'ninja-forms-videomail'),
    'width' => 'full',
    'group' => 'advanced',
    'value' => FALSE,
    'help' => __('Show verbose comments in the developer console.', 'ninja-forms-videomail')
  )
));