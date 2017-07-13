var all_pservices = [];
var all_services_lookup = {};
var _settings = null;

function reload_all_services ()
{
    var i;

    var sel = {};
    for (i = 0; i < _settings.selected_services.length; i++)
    {
        var id = _settings.selected_services[i];

        sel[id] = 1;
    }

    var all_services_list = $("<div />", { class: 'list-group' });
    for (i = 0; i < all_services.length; i++)
    {
        var id = all_services[i][0];
        var name = all_services[i][1];

        var checked = '';

        if (typeof sel[id] !== 'undefined')
        {
            checked = " checked=\"checked\"";
        }

        var cb = $("<label class=\"custom-control custom-checkbox\">"
            + "<input type=\"checkbox\" class=\"custom-control-input\" name=\"service_" + i
            + "\" value=\"" + id + "\"" + checked + ">"
            + "<span class=\"custom-control-indicator\"></span>"
            + "<span class=\"custom-control-description\">" + name + "</span></label>"
        );

        all_services_list.append (cb);
    }

    $('#form-select-services').empty ();
    $('#form-select-services').append (all_services_list);


    sel = {};
    for (i = 0; i < _settings.selected_pservices.length; i++)
    {
        var id = _settings.selected_pservices[i];

        sel[id] = 1;
    }

    var all_pservices_list = $("<div />", { class: 'list-group' });
    for (i = 0; i < all_pservices.length; i++)
    {
        var id = all_pservices[i][0];
        var name = all_pservices[i][1];

        var checked = '';

        if (typeof sel[id] !== 'undefined')
        {
            checked = " checked=\"checked\"";
        }

        var cb = $("<label class=\"custom-control custom-checkbox\">"
            + "<input type=\"checkbox\" class=\"custom-control-input\" name=\"service_" + i
            + "\" value=\"" + id + "\"" + checked + ">"
            + "<span class=\"custom-control-indicator\"></span>"
            + "<span class=\"custom-control-description\">" + name + "</span></label>"
        );

        all_pservices_list.append (cb);
    }

    $('#form-select-pservices').empty ();
    $('#form-select-pservices').append (all_pservices_list);
}



function reload_selected_services ()
{
    var div = $("<div />", { class: 'list-group' });
    for (var i = 0; i < _settings.selected_services.length; i++)
    {
        var id =  _settings.selected_services[i];
        var name = all_services_lookup[id][1];
        var url = all_services_lookup[id][3];
        var e = $("<a>", {
            class: 'list-group-item list-group-item-action',
            text: name,
            href: url,
            target: '_top'
        });
        div.append(e);
    }

    $('#selected-services').empty ();
    $('#selected-services').append (div);
}


function reload_selected_pservices ()
{
    var div = $("<div />", { class: 'list-group' });
    for (var i = 0; i < _settings.selected_pservices.length; i++)
    {
        var id =  _settings.selected_pservices[i];
        var name = all_services_lookup[id][1];
        var url = all_services_lookup[id][3];
        var e = $("<a>", {
            class: 'list-group-item list-group-item-action',
            text: name,
            href: url,
            target: '_top'
        });
        div.append(e);
    }

    $('#selected-pservices').empty ();
    $('#selected-pservices').append (div);
}

function on_hide_select_services_modal ()
{
    _settings.selected_services = [];

    for (var i = 0; i < all_services.length; i++)
    {
        var selector = "#form-select-services input[name='service_" + i + "']";
        if ($(selector).is(':checked'))
        {
            _settings.selected_services.push (all_services[i][0]);
        }
    }

    save_settings ();
    reload_selected_services ();
}


function on_hide_select_pservices_modal ()
{
    _settings.selected_pservices = [];

    for (var i = 0; i < all_pservices.length; i++)
    {
        var selector = "#form-select-pservices input[name='service_" + i + "']";
        if ($(selector).is(':checked'))
        {
            _settings.selected_pservices.push (all_pservices[i][0]);
        }
    }

    save_settings ();
    reload_selected_pservices ();
}

function save_settings ()
{
    window.parent.postMessage ({
        action: 'save_settings',
        payload: _settings
    }, '*');
}


function on_button_close_click ()
{
    window.parent.postMessage ({
        action: 'close_sidebar',
        payload: null
    }, '*');
}

function init_ui ()
{
    console.log ("[init_ui] entering...");
    $('#modal_select_services').on ('hide.bs.modal', on_hide_select_services_modal);
    $('#modal_select_pservices').on ('hide.bs.modal', on_hide_select_pservices_modal);
    $('#button-close').click (on_button_close_click);

    console.log ("[init_ui] setting sticky tabs...");

    // make tabs sticky
    // https://stackoverflow.com/questions/10523433/how-do-i-keep-the-current-tab-active-with-twitter-bootstrap-after-a-page-reload
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        // save the latest tab; use cookies if you like 'em better:
        localStorage.setItem('lastTab', $(this).attr('href'));
    });

    // go to the latest tab, if it exists:
    var lastTab = localStorage.getItem('lastTab');
    if (lastTab) {
        $('[href="' + lastTab + '"]').tab('show');
    }

    console.log ("[init_ui] loading selected services...");
    reload_selected_services ();
    console.log ("[init_ui] loading selected pricing services...");
    reload_selected_pservices ();
    console.log ("[init_ui] loading all services...");
    reload_all_services ();

    console.log ("[init_ui] done.");
}

function setMessageListener ()
{
    window.addEventListener ('message', function (e) {
        switch (e.data.action)
        {
            case 'get_settings_result':
                _settings = e.data.payload;
                init_ui ();
                break;
        }
    }, false);
}



// compute the list of pricing services (services for which we have pricing URLs)
function process_services ()
{
    all_pservices = [];
    all_services_lookup = {};
    for (var i = 0; i < all_services.length; i++)
    {
        var id = all_services[i][0];

        // if we have a pricing URL for this service, include it
        if (all_services[i][3])
        {
            all_pservices.push (all_services[i]);
        }

        all_services_lookup[id] = all_services[i];
    }
}

function init ()
{
    process_services ();
    setMessageListener ();

    window.parent.postMessage({
        action: 'get_settings',
        payload: null
    }, '*');
}

$(function () {
    init ();
});
