function aws_info () {
    var _self = this;
    var _instances = [];
    var _instance_timestamp = 0;

    // this filter governs which instances we will actually keep
    var _data_tag_filter = '';
    var _data_state_filter = '';

    _self.init = function (settings)
    {
        console.debug ("[init] entering...");

        AWS.config.region = settings.sync.aws_region;
        AWS.config.credentials = new AWS.Credentials ({
            accessKeyId: settings.local.aws_access_key_id,
            secretAccessKey: settings.local.aws_secret_access_key
        });

        _data_tag_filter = settings.sync.instance_tag_filter;
        _data_state_filter = settings.sync.instance_state_filter;
    };

    function test_tag_filter (filter, instance)
    {
        // @todo - validation of filter syntax?
        var filters = filter.split (";");

        for (var i = 0; i < filters.length; i++)
        {
            var kv = filters[i].split ("=");
            var tag = kv[0];
            var regex = kv[1];

            var re = new RegExp(regex, "g");

            console.debug (" - tag[" + tag + "] '" + instance.tags[tag] + "' =~ " + re);
            if (typeof instance.tags[tag] === 'undefined')
            {
                console.debug ("   tag not defined");
                return false;
            }

            if (!re.test (instance.tags[tag]))
            {
                console.debug ("   no match");
                return false;
            }
            else
            {
                console.debug ("   match");
            }
        }

        console.debug ("   instance passes tag filter.");
        return true;
    }

    function test_state_filter (states, instance)
    {
        var re = new RegExp("^(" + states.join ('|') + ")$", "g");

        console.debug (" - instance state '" + instance.state + "' =~ " + re);

        if (re.test (instance.state))
        {
            console.debug ("   match");
            return true;
        }

        console.debug ("   no match");
        return false;
    }

    _self.list_instances = function (callback)
    {
        console.debug ("[aws_info.list_instances] entering...");

        var ec2 = new AWS.EC2();

        _instance_timestamp = localStorage.getItem ('aws.ec2.instance_timestamp');
        var ins_str = localStorage.getItem ('aws.ec2.instances');
        if (ins_str !== null)
        {
            try
            {
                _instances = JSON.parse (ins_str);
            }
            catch (e)
            {
                _instances = [];
                _instance_timestamp = 0;
            }
        }

        console.debug ("[aws_info.list_instances] _instance_timestamp: ", _instance_timestamp);
        console.debug ("[aws_info.list_instances] _instances: ", _instances);

        // @TODO - save instances and timestamp somewhere that they can survive a page reload
        if (_instance_timestamp > Date.now() - 300000)
        {
            console.log ("[aws_info.list_instances] using cached instance data: ", _instances);
            callback (_instances);
            return;
        }

        console.log ("[aws_info.list_instances] retrieving instance data from EC2...");

        ec2.describeInstances({}, function(err, data) {
            if (err) return console.debug(err, err.stack);

            _instances = [];
            for (var i in data.Reservations) {
                var info = {};

                var ins = data.Reservations[i].Instances[0];

                console.log ("instance: ", ins);

                info.instance_id = ins.InstanceId;
                info.state = ins.State.Name;
                info.instance_type = ins.InstanceType;
                info.private_ip_address = ins.PrivateIpAddress;
                info.launch_time = ins.LaunchTime;
                info.image_id = ins.ImageId;
                info.az = ins.Placement.AvailabilityZone;

                if (typeof ins.PublicIpAddress === 'undefined')
                {
                    info.public_ip_address = '';
                }
                else
                {
                    info.public_ip_address = ins.PublicIpAddress;
                }

                info.tags = {};
                info.name = '<unknown>';
                info.asg = '';
                for (var j = 0; j < ins.Tags.length; j++) {
                    if (ins.Tags[j].Key === 'Name')
                    {
                        info.name = ins.Tags[j].Value;
                        continue;
                    }
                    if (ins.Tags[j].Key === 'aws:autoscaling:groupName')
                    {
                        info.asg = ins.Tags[j].Value;
                        continue;
                    }

                    info.tags[ins.Tags[j].Key] = ins.Tags[j].Value;
                }

                info.security_groups = [];
                for (j = 0; j < ins.SecurityGroups.length; j++)
                {
                    var g = ins.SecurityGroups[j];
                    info.security_groups.push ({
                        'name': g.GroupName,
                        'id': g.GroupId
                    });
                }

                console.debug ("info: ", info);

                if (test_tag_filter (_data_tag_filter, info) && test_state_filter (_data_state_filter, info))
                {
                    console.debug ("keeper");
                    _instances.push (info);
                }
            }

            console.debug ("sorting " + _instances.length + " instances...");
            _instances.sort (function (a, b) {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }

                // names must be equal
                return 0;
            });

            _instance_timestamp = Date.now ();

            localStorage.setItem ('aws.ec2.instance_timestamp', _instance_timestamp);
            localStorage.setItem ('aws.ec2.instances', JSON.stringify (_instances));

            callback (_instances);
        });
    };

    return _self;
}