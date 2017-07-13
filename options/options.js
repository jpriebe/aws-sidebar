// Saves options to chrome.storage
function save_options ()
{
    console.log ('saving');
    var settings_json = document.getElementById ('settings_json').value;

    var settings = JSON.parse (settings_json);

    chrome.storage.sync.set ({
        settings: settings
    }, function ()
    {
        // Update status to let user know options were saved.
        var status = document.getElementById ('status');
        status.textContent = 'Options saved.';
        setTimeout (function ()
        {
            status.textContent = '';
        }, 1250);
    });
    console.log ('saved options');
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options ()
{
    chrome.storage.sync.get ("settings",
    function (items)
    {
        document.getElementById ('settings_json').value = JSON.stringify (items.settings);
    });
}

console.log ('adding event listeners...');
document.addEventListener ('DOMContentLoaded', restore_options);
document.getElementById ('save').addEventListener ('click', save_options);