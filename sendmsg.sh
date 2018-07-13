#!/bin/bash
KEY="606247002:AAFn1i4I5QlevDMTP7gS22t1GpaBrUYku3s"
TIME="10"
URL="https://api.telegram.org/bot$KEY/sendMessage"
TEXT=$MSG

for CHATID in $IDS
do
    curl -s --max-time $TIME -d "chat_id=$CHATID&text=$TEXT" $URL >/dev/null
done
