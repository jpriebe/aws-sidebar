function options_manager ()
{
    var _self = this;

    var _settings_mgr = null;

    _self.init = function () {
        document.getElementById ('save').addEventListener ('click', save_options);

        _settings_mgr = new settings_manager ();
        _settings_mgr.init (function () {
            var settings = _settings_mgr.get_settings ();
            console.log ('loading settings: ', settings);
            document.getElementById ('settings_json').value = JSON.stringify (settings, null, 2);
        });
    };

    function save_options ()
    {
        console.log ('saving...');
        var settings_json = document.getElementById ('settings_json').value;
        var settings = JSON.parse (settings_json);

        _settings_mgr.save_settings (settings);

        // Update status to let user know options were saved.
        var status = document.getElementById ('status');
        status.textContent = 'Options saved.';
        setTimeout (function ()
        {
            status.textContent = '';
        }, 1250);

        console.log ('saved settings');
    }

    return _self;
}


document.addEventListener ('DOMContentLoaded', function (){
    var om = new options_manager();
    om.init ();
});
