from systemd import journal
import re
import pymongo
from pymongo import MongoClient
import json
import os
import subprocess
import requests
import time
from requests_futures.sessions import FuturesSession

#db = MongoClient("mongodb+srv://sherry:MfsiAta5p@cluster0-2etvy.gcp.mongodb.net/BotData")
db = MongoClient("mongodb://gaiabot:qKS29mHsm63tPk5v@ds151049.mlab.com:51049/gaiabot")
client = db.gaiabot
collection = client.ValAddrID

#KEY="606247002:AAFn1i4I5QlevDMTP7gS22t1GpaBrUYku3s"
KEY="695435732:AAEAIO3cJMy85jwF7pUtUKXCo9-BX5vAF-w"
TIME="10"
URL="https://api.telegram.org/bot" + KEY + "/sendMessage"

j = journal.Reader()
j.this_boot()
j.seek_tail()
j.log_level(journal.LOG_INFO)
j.add_match(_SYSTEMD_UNIT="gaiad.service")

chatidset = set()

try:
  while True:
    for entry in j:
        # match Absent validator
        matchAbsent = re.search(r'/.*Absent validator ([0-9A-F]{40}) at height ([0-9]{1,}).*/' , str(entry))
        # match past min height
        matchMinHeight = re.search(r'/.*Validator ([0-9A-F]{40}) past min height of ([0-9]{1,}) and below signed blocks threshold of ([0-9]{1,}).*/', str(entry))
        # match how many shares and tokens reduced
        matchReduced = re.search(r'/.*Validator ([0-9A-F]{40}) slashed by fraction ([0-9]{1,}\/[0-9]{1,}), removed ([0-9]{1,}\/[0-9]{1,}) shares and burned ([0-9]{1,}) tokens.*/', str(entry))
        # match revoke
        matchRevoke = re.search(r'/.*Validator ([0-9A-F]{40}) revoked.*/', str(entry))

        if (matchAbsent):
            valAddr = matchAbsent.group(1)
            print("Absent: "+entry["MESSAGE"])
        elif (matchMinHeight):
            print("MinHeight: "+entry["MESSAGE"])
            valAddr = matchMinHeight.group(1)

        elif (matchReduced):
            print("Reduced: "+entry["MESSAGE"])
            valAddr = matchReduced.group(1)
        elif (matchRevoke):
            print("Revoke: "+entry["MESSAGE"])
            valAddr = matchRevoke.group(1)
        else:
            break

        # get the message that will be send out
        msg = entry["MESSAGE"]

	# check if the validator is exist in the db.
        # query the chat ID by validator
        stringjson = '{"ValAddr": \"' + valAddr + '\"}'
        for record in collection.find(json.loads(stringjson)):
            chatid = str(record.get("chatID"))
            mute = record.get("mute")
            print(mute)
            if (mute == False):
                chatidset.add(chatid)
        chatids = tuple(chatidset)
        print(chatids)

        start = time.time()
        # if there are chatids, run the bash script to send message
        session = FuturesSession()
        for id in chatids:
             session.get("https://api.telegram.org/bot695435732:AAEAIO3cJMy85jwF7pUtUKXCo9-BX5vAF-w/sendMessage?chat_id=" + id + "&text=" + msg)
        end = time.time()
        print("time: ", end-start)
        chatidset = set()

except KeyboardInterrupt:
    db.close()
    print("database closed")
