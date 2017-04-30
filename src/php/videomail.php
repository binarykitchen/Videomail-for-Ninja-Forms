<?php
final class NF_Videomail {

  // todo check if those fields are every used???
  const VERSION = '3.2.0';
  const SLUG = 'videomail';
  const NAME = 'Videomail';
  const AUTHOR = 'Michael Heuberger + Kyle B. Johnson';
  const PREFIX = 'NF_Videomail';

  private static $instance;
  public static $dir = '';
  public static $phpDir = '';
  public static $templatesDir = '';
  public static $url = '';
  public static $jsUrl = '';
  public static $cssUrl = '';

  /**
   * Main Plugin Instance
   *
   * Ensures that only one instance of a plugin class exists in memory at any one
   * time. Also prevents needing to define globals all over the place.
   */
  public static function instance($dir, $url) {
    if (!isset(self::$instance) && !(self::$instance instanceof NF_Videomail)) {
      self::$instance = new NF_Videomail();
      self::$dir = $dir;
      self::$phpDir = $dir . 'php' . DIRECTORY_SEPARATOR;
      self::$templatesDir = self::$phpDir . 'templates' . DIRECTORY_SEPARATOR;
      self::$url = $url;
      self::$jsUrl = $url . 'js/';
      self::$cssUrl = $url . 'css/';
      spl_autoload_register(array(self::$instance, 'autoloader'));
    }

    return self::$instance;
  }

  public function autoloader($class_name) {
    if (class_exists($class_name)) return;
    if (false === strpos($class_name, self::PREFIX)) return;

    $classes_dir = realpath(plugin_dir_path(__FILE__));

    $class_name = str_replace(self::PREFIX, '', $class_name);
    $class_file = str_replace('_', DIRECTORY_SEPARATOR, $class_name) . '.php';
    $fileUrl = $classes_dir . strtolower($class_file);

    if (file_exists($fileUrl)) {
      require_once $fileUrl;
    }
  }

  public function __construct() {
    add_action('ninja_forms_loaded', array($this, 'ninja_forms_loaded'));
    add_filter('ninja_forms_register_fields', array($this, 'register_fields'));
    add_filter('ninja_forms_register_actions', array($this, 'register_actions'));
    add_filter('ninja_forms_field_template_file_paths', array($this, 'custom_template_path'));
  }

  public function ninja_forms_loaded() {
    new NF_Videomail_Admin_Metaboxes_Submission();
  }

  public function register_fields($actions) {
    $actions['videomail'] = new NF_Videomail_Fields_Videomail();

    return $actions;
  }

  public function register_actions($actions) {
    return $actions;
  }

  public function custom_template_path($paths) {
    $paths[] = self::$templatesDir;

    return $paths;
  }

  public static function template($file_name = '', array $data = array()) {
    if (!$file_name) return;

    extract($data);

    include self::$templatesDir . $file_name;
  }

  public static function config($file_name) {
    return include self::$phpDir . 'config' . DIRECTORY_SEPARATOR . $file_name . '.php';
  }
}
