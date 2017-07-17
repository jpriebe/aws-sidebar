function link_listgroup_panel (all_links, selected_links, on_selected_change_cb, lg_selector, form_selector, modal_selector)
{
    var _self = this;

    var _all_links = all_links;
    var _selected_links = selected_links;
    var _on_selected_change_cb = on_selected_change_cb;
    var _lg_selector = lg_selector;
    var _form_selector = form_selector;
    var _modal_selector = modal_selector;

    var _all_links_lookup = [];

    init ();

    function init ()
    {
        _all_links_lookup = {};
        for (var i = 0; i < _all_links.length; i++)
        {
            var id = _all_links[i][0];
            _all_links_lookup[id] = _all_links[i];
        }

        $(_modal_selector).on ('hide.bs.modal', on_hide_modal);

        reload_all_links ();
        reload_selected_links ();
    }

    function on_hide_modal ()
    {
        for (var i = 0; i < _all_links.length; i++)
        {
            var selector = _form_selector + " input[name='service_" + i + "']";
            if ($(selector).is(':checked'))
            {
                _selected_links.push (_all_links[i][0]);
            }
        }

        _self.reload_selected_links ();

        _on_selected_change_cb (_selected_links);
    }

    function reload_selected_links ()
    {
        var div = $("<div />", { class: 'list-group' });
        for (var i = 0; i < _selected_links.length; i++)
        {
            var id =  _selected_links[i];
            var name = _all_links_lookup[id][1];
            var url = _all_links_lookup[id][2];
            var e = $("<a>", {
                class: 'list-group-item list-group-item-action',
                text: name,
                href: url,
                target: '_top'
            });
            div.append(e);
        }

        $(_lg_selector).empty ();
        $(_lg_selector).append (div);
    }

    function reload_all_links () {
        var i;

        var sel = {};
        for (i = 0; i < _selected_links.length; i++)
        {
            var id = _selected_links[i];

            sel[id] = 1;
        }

        var all_links_list = $ ("<div />", {class: 'list-group'});
        for (i = 0; i < _all_links.length; i++)
        {
            var id = _all_links[i][0];
            var name = _all_links[i][1];

            var checked = '';

            if (typeof sel[id] !== 'undefined')
            {
                checked = " checked=\"checked\"";
            }

            var cb = $ ("<label class=\"custom-control custom-checkbox\">"
                + "<input type=\"checkbox\" class=\"custom-control-input\" name=\"service_" + i
                + "\" value=\"" + id + "\"" + checked + ">"
                + "<span class=\"custom-control-indicator\"></span>"
                + "<span class=\"custom-control-description\">" + name + "</span></label>"
            );

            all_links_list.append (cb);
        }

        $(_form_selector).empty ();
        $(_form_selector).append (all_links_list);

        return _self;
    }

}