#!/bin/bash
LOCAL_DIR="./out"
aws s3 sync $LOCAL_DIR s3://abogabot-front/

aws cloudfront create-invalidation --distribution-id E1ME75H6VF9UNR --paths "/*"