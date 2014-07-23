define(['underscore', 'common/jed'], function(_) {
  var msgs = {
    e_brwsr_na: [null, 'Brwsr not found'],
    e_brwsr_timeout: [null, 'Timed-out waiting for browser to run on server. All servers seem to be busy at this moment.'],
    e_req: [null, 'Request to server failed.'],
    e_sel_0_save: [null, 'No selections could be found to be saved.'],
    e_signin_invalid: [null, 'Sign in failed, please check your username and password and try again'],

    a_action_object: [null, '%1$s %2$s'],
    a_action_reload: [null, 'Reload'],
    a_add: [null, 'Add'],
    a_add_action: [null, 'Add Action'],
    a_apply: [null, 'Apply'],
    a_check_changes: [null, 'Check for changes'],
    a_close: [null, 'Close'],
    a_del: [null, 'Delete'],
    a_del_permanent: [null, 'Delete Permanently'],
    a_discard: [null, 'Discard'],
    a_edit: [null, 'Edit'],
    a_edit_options: [null, 'Edit Options'],
    a_load_website_in_sieve: [null, 'Go!'],
    a_mark_read: [null, 'Mark as read'],
    a_move_to_trash: [null, 'Move to Trash'],
    a_play: [null, 'Play'],
    a_register: [null, 'Create Account'],
    a_rename: [null, 'Rename'],
    a_restore: [null, 'Restore'],
    a_save: [null, 'Save'],
    a_select: [null, 'Select'],
    a_signin: [null, 'Sign In'],
    a_sieve_new: [null, 'Add Webpage'],
    a_toggle_changes: [null, 'Show/Hide Changes'],
    a_visual_selection: [null, 'Select Contents From Webpage'],
    a_window_close: [null, 'Close Window'],
    a_verify: [null, 'Verify'],

    h_brwsr_closed: [null, 'Remote browser has stopped working. Please try to start new browser.'],
    h_brwsr_disconnect: [null, 'Connection to remote browser has been broken. Please try to start new browser.'],
    h_config_show: [null, 'Show config'],
    h_email_addr: [null, 'Email address, e.g. name@example.com'],
    h_del_action: [null, 'Delete action'],
    h_opening_selector_in_new_tab: [null, 'Opening new tab to select content...'],
    h_opened_selector_in_tab: [null, 'Opened new tab to select source content.'],
    h_phone: [null, '# international format: +19999999999'],
    h_regexp_filter: [null, 'Regular expression to filter text content'],
    h_selector_edit: [null, 'Select content from a webpage.'],
    h_sieve_empty: [null, 'Empty text in selected source. If it is unexpected, please consider changing source selections.'],
    h_sieve_new: [null, 'Preview will be available soon after this task is run.'],
    h_sieve_no_config: [null, 'No source has been selected. Edit options to select content from a webpage.'],
    h_try_later: [null, 'Please try again later.'],

    l_account: [null, 'Account'],
    l_actions: [null, 'Actions'],
    l_action_email: [null, 'Get Email'],
    l_action_local_audio: [null, 'Play Audio Clip'],
    l_action_local_popup: [null, 'Show Notification Popup'],
    l_action_macro: [null, 'Run Macro'],
    l_action_push: [null, 'Get Push Notification'],
    l_action_sms: [null, 'Get SMS'],
    l_asian_koel: [null, 'Asian Koel'],
    l_all: [null, 'all'],
    l_any: [null, 'any'],
    l_brwsr: [null, 'Brwsr'],
    l_bell_strike: [null, 'Bell Strike'],
    l_changed_on: [null, 'Last changed on'],
    l_changed_text: [null, 'Changed text'],
    l_check_log: [null, 'Update check log'],
    l_condition: [null, 'Condition'],
    l_css_selector: [null, 'CSS Selector'],
    l_done: [null, 'Done'],
    l_ding_dong: [null, 'Ding Dong'],
    l_email: [null, 'Email'],
    l_email_addr: [null, 'Email Address'],
    l_fullname: [null, 'Full Name'],
    l_has: [null, 'has'],
    l_has_not: [null, 'does not have'],
    l_has_num_gt: [null, 'has number more than (>)'],
    l_has_num_lt: [null, 'has number less than (<)'],
    l_has_num_decr_min: [null, 'number decreased (-Δ) more than'],
    l_has_num_incr_min: [null, 'number increased, (+Δ) more than'],
    l_js: [null, 'JavaScript'],
    l_label: [null, 'Label'],
    l_loading: [null, 'Loading'],
    l_macro: [null, 'Macro'],
    l_name: [null, 'Name'],
    l_name_or_email: [null, 'Username or Email'],
    l_num: [null, 'Number'],
    l_not_empty: [null, 'is not empty'],
    l_options: [null, 'Options'],
    l_password: [null, 'Password'],
    l_phone: [null, 'Phone Number'],
    l_prompt: [null, 'Prompt'],
    l_regexp_filter: [null, 'RegExp Filter'],
    l_reset_sel: [null, 'Reset Selections'],
    l_rule: [null, 'Condition'],
    l_rule_group: [null, 'Compound Condition'],
    l_rule_true_if_matches_x: [null, 'True if matches'],
    l_schedule: [null, 'Schedule'],
    l_selector: [null, 'Selector'],
    l_select_el: [null, 'Select Elements'],
    l_selection_config: [null, 'Selection Config'],
    l_settings: [null, 'Settings'],
    l_signed_in_as: [null, 'Signed in as %s'],
    l_source: [null, 'Source'],
    l_text: [null, 'Text'],
    l_tone: [null, 'Text'],
    l_username: [null, 'Username'],
    l_verification_code: [null, 'Verification Code'],
    l_verification_req: [null, 'Verification Required'],
    l_visual_selector: [null, 'Visual Selector'],
    l_search_input_label: [null, 'Enter the website url here'],
    l_search_label: [null, 'Tell us the website to track'],
    l_x_of_following_rules: [null, 'of following conditions'],
    l_xpath: [null, 'XPath'],

    m_del_item: [null, 'Moved one item to trash.'],
    m_del_items: [null, 'Moved %1$s items to trash.'],
    m_1_day: [null, '1 day'],
    m_n_day: [null, '%d days'],
    m_1_hour: [null, '1 hour'],
    m_n_hour: [null, '%d hours'],
    m_1_minute: [null, '1 min'],
    m_n_minute: [null, '%d mins'],
    m_1_second: [null, '1 sec'],
    m_n_second: [null, '%d secs'],
    m_log_na: [null, 'Log is empty. Logs appear after the source is checked for updates.'],
    m_login_success: [null, 'Login successful'],
    m_never: [null, 'Never'],
    m_save_selections_none: [null, 'There is no selection to save.'],
    m_selection_discarded: [null, 'Selections were discarded.'],
    m_selection_saved: [null, 'Selections saved.'],
    m_start_end_of_total: [null, '%1$s-%2$s of %3$s'],
    m_verification_code: [null, 'You will receive a message with a code on your %1$s. Please enter the code below to verify it.']
  };

  return new Jed({
    locale_data: {
      messages: _.extend({
        '': {
          domain: 'messages',
          lang: 'en',
          plural_forms: 'nplurals=2; plural=(n != 1);'
        }
      }, msgs)
    },
    missing_key_callback: function(key) {
      // XXX Uncomment when testing localization
      //DBG && console.warn('missing locale key:', key);
    },
    domain: 'messages'
  });
});
