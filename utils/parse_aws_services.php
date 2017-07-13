#!/usr/bin/php
<?php

$services = array ();

$g_codes = array (
    'cloudwatch_logs' => 1,
    'ec2_instances' => 1,
    'ec2_elb' => 1,
    'ec2_ebs' => '1',
    'rds_instances' => 1,
);

$g_names = array (
    'cloudwatch_logs' => 'Cloudwatch Logs',
    'ec2_instances' => 'EC2 Instances',
    'ec2_elb' => 'EC2 ELB',
    'ec2_ebs' => 'EC2 EBS',
    'rds_instances' => 'RDS Instances',
);

$g_mgmt_urls = array (
    'cloudwatch_logs' => 'https://console.aws.amazon.com/cloudwatch/home#logs:',
    'ec2_instances' => 'https://console.aws.amazon.com/ec2/v2/home#Instances:',
    'ec2_elb' => 'https://console.aws.amazon.com/ec2/v2/home#LoadBalancers:',
    'ec2_ebs' => 'https://console.aws.amazon.com/ec2/v2/home#Volumes:',
    'rds_instances' => 'https://console.aws.amazon.com/rds/home#dbinstances:',
);

$g_pricing_urls = array (
);

$fp = fopen ("aws_services.html", "r");
while ($line = fgets ($fp))
{
    if (!preg_match_all ('#<a\s+href="(.+?)".+?>(.+?)</a>#', $line, $matches))
    {
        continue;
    }

    $urls = $matches[1];
    $names = $matches[2];

    $num_urls = count ($urls);
    for ($i = 0; $i < $num_urls; $i++)
    {
        $url = $urls[$i];
        $name = html_entity_decode (strip_tags ($names[$i]));

        $code = strtolower (trim ($name));
        $code = preg_replace ('#\s+#', '_', $code);

        $name = preg_replace ('#^Amazon\s+#', '', $name);
        $url = preg_replace ('#\?region=.+$#', '', $url);

        $g_codes[$code] = $code;
        $g_names[$code] = $name;
        $g_mgmt_urls[$code] = $url;
    }
}
fclose ($fp);

$fp = fopen ("aws_pricing.html", "r");
while ($line = fgets ($fp))
{
    if (!preg_match_all ('#<a.+?href="(.+?)".*?>(.+?)</a>#', $line, $matches))
    {
        continue;
    }

    $urls = $matches[1];
    $names = $matches[2];

    $num_urls = count ($urls);
    for ($i = 0; $i < $num_urls; $i++)
    {
        $url = $urls[$i];

        $name = trim (html_entity_decode (strip_tags ($names[$i])));
        $code = find_code ($name);

        $name = preg_replace ('#^(Amazon|AWS)\s+#', '', $name);

        /*
        if (!$code)
        {
            print "$code\n$name\n$url\n\n";
        }
        */

        $url = preg_replace ('#^/#', 'https://aws.amazon.com/', $url);

        $g_pricing_urls[$code] = $url;
    }
}
fclose ($fp);

function find_code ($name)
{
    global $g_codes;

    $code = strtolower (trim ($name));
    $code = preg_replace ('#\s+#', '_', $name);
    if (isset ($g_codes[$code]))
    {
        return $code;
    }

    $name = preg_replace ('#^(Amazon|AWS)\s+#', '', $name);

    $overrides = array (
        'Database Migration Service' => 'dms',
        'Directory Services' => 'directory_service',
        'Elastic Block Storage (EBS)' => 'ec2_ebs_volumes',
        'Elastic Compute Cloud (EC2) Container Service' => 'ec2_container_service',
        'Elastic Load Balancing' => 'ec2_load_balancers',
        'Greengrass' => 'aws_greengrass',
        'IoT Platform' => 'aws_iot',
        'Simple Email Service' => 'ses',
        'WAF' => 'waf_&_shield',
    );

    if (isset ($overrides[$name]))
    {
        return $overrides[$name];
    }

    $code = strtolower (trim ($name));
    $code = preg_replace ('#\s+#', '_', $code);
    if (isset ($g_codes[$code]))
    {
        return $code;
    }

    if (preg_match ('#\((.+?)\)#', $name, $matches))
    {
        $code = strtolower (trim ($matches[1]));
        $code = preg_replace ('#\s+#', '_', $code);

        if (isset ($g_codes[$code]))
        {
            return $code;
        }
    }
}

$codes = array_keys ($g_codes);

usort ($codes, function ($a, $b) { global $g_names; return strcmp ($g_names[$a], $g_names[$b]); });

$output = array ();
foreach ($codes as $code)
{
    $pricing_url = '';
    if (isset ($g_pricing_urls[$code])) {
        $pricing_url = $g_pricing_urls[$code];
    }

    $output[] = array (
        $code,
        $g_names[$code],
        $g_mgmt_urls[$code],
        $pricing_url
    );
}

print json_encode ($output, JSON_PRETTY_PRINT);
