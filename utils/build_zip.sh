#!/bin/sh

cd ../..
zip -r /tmp/aws-sidebar.zip aws-sidebar/ -x *.git* -x *.idea* -x *.DS_Store* -x *utils*
