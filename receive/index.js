const Telegraf = require('telegraf')
const mongo = require('mongodb')
const util = require('util')
const exec = util.promisify(require('child_process').exec)


const MongoClient = require('mongodb').MongoClient, test = require('assert');

//const uri = "mongodb+srv://sherry:MfsiAta5p@cluster0-2etvy.gcp.mongodb.net/BotData";
const uri = "mongodb://gaiabot:qKS29mHsm63tPk5v@ds151049.mlab.com:51049/gaiabot";

const bot = new Telegraf(process.env.BOT_TOKEN)

const cosvaladdrpattern = RegExp(/^[a-fA-F0-9]{40}$/)

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('I am a bot from Forbole that will notify you when something happened to your subscribed validator in the Gaia-7001.'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.hears(/buy/i, (ctx) => ctx.reply('buy-buy lol'))

// bot.command('/start', async ({ from, replyWithMarkdown, botInfo}) =>
//     replyWithMarkdown(`Hi *${from.first_name || forma.tusername}* !

// Welcome, i am *${botInfo.first_name}*, a melophile just like you.`));

async function run_cmd(command) {
    const {stdout, stderr} = await exec(command, { shell: true });

    if (stderr) {
        console.error(`error: ${stderr}`);
    }
    console.log(`addr: ${stdout}`)
    valaddr = stdout
    return valaddr
}

bot.command('/subscribe', async(ctx, next) => {
    ctx.reply('Which validator would you like to subscribe? Please give me the validator addres in hex.')
    return next(ctx).then(() => {
        var correct = 0

        bot.hears(/^[a-fA-F0-9]{40}$/i, (ctx) => {
            // send address and chat id to mongoDB
            // get charid and valaddr

            var chatid = ctx.message.chat.id
            var cosvaladdr = ctx.message.text
            //var cmd_debug = 'gaiadebug addr ' + cosvaladdr + ' | grep Address | cut -d " " -f2'

            //run_cmd(cmd_debug).then(function(result){
                valaddr = cosvaladdr.replace(/\n/, '')
                MongoClient.connect(uri, function(err, client) {
                    if(err) {
                        console.log('Error occurred while connecting to MongoDB...\n',err);
                    }
                    console.log('Connected...');
                    const collection = client.db("gaiabot").collection("ValAddrID");
                    // perform actions on the collection object
                    // check if this validator address is already subscribed
                    var query = '{ "chatID": ' + chatid + ', "ValAddr": \"' + valaddr + '\" }'
                    if (collection.find(query).count() > 0) {
                        ctx.reply("You have already subscribed this validator")
                        client.close();
                    } else {
                        // if not yet subscribe, add it
                        collection.insertOne({chatID:chatid, ValAddr:valaddr, mute: false}, function(err, r) {
                            test.equal(null, err);
                            test.equal(1, r.insertedCount);
                            // Finish up test
                            client.close();

                            // reply user
                            ctx.reply("successfully subscribe " + ctx.message.text)
                        });
                    }
                });

            //})
        })
    })
});

bot.command("/mute", async(ctx, next) => {
    var chatid = ctx.message.chat.id
    var text = ctx.message.text
    var texts = text.split(' ')
    cosvaladdr = texts[1]

    if (typeof cosvaladdr == 'undefined') {
        ctx.reply("Usage: /mute [validator address in hex]")
    }
    else if (cosvaladdrpattern.test(cosvaladdr)) {

        //var cmd_debug = 'gaiadebug addr ' + cosvaladdr + ' | grep Address | cut -d " " -f2'
        //run_cmd(cmd_debug).then(function(result){
            valaddr = cosvaladdr.replace(/\n/, '')

            // if (cosvaladdrpattern.test(cosvaladdr)) {
            // if validatoraddr exists in the db, change mute to true
            MongoClient.connect(uri, function(err, client) {
                if(err) {
                    console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
                }
                console.log('Connected...');
                const collection = client.db("gaiabot").collection("ValAddrID");

                var query = '{ "chatID": ' + chatid + ', "ValAddr": \"' + valaddr + '\" }'
                var newvalue = { $set: {mute: true} }
                query = JSON.parse(query)
                // newvalue = JSON.parse(newvalue)
                // var query =

                if (collection.find(query)) {
                    collection.updateOne(query, newvalue, function(err, res) {
                        if(err) throw err
                        console.log("updated")
                        ctx.reply("Validator address " + cosvaladdr + " is muted")
                        client.close()
                    });
                } else {
                    ctx.reply("You didn't subscribe validator " + cosvaladdr + " yet")
                }
            });
        //})
    } else {
        ctx.reply("Wrong validator address, cannot be muted")
    }
})

bot.command("/unmute", async(ctx, next) => {
    var chatid = ctx.message.chat.id
    var text = ctx.message.text
    var texts = text.split(' ')
    cosvaladdr = texts[1]

    if (typeof cosvaladdr == 'undefined') {
        ctx.reply("Usage: /unmute [validator address in hex]")
    }
    else if (cosvaladdrpattern.test(cosvaladdr)) {

        //var cmd_debug = 'gaiadebug addr ' + cosvaladdr + ' | grep Address | cut -d " " -f2'
        //run_cmd(cmd_debug).then(function(result){
            valaddr = cosvaladdr.replace(/\n/, '')

            // if (cosvaladdrpattern.test(cosvaladdr)) {
            // if validatoraddr exists in the db, change mute to true
            MongoClient.connect(uri, function(err, client) {
                if(err) {
                    console.log('Error occurred while connecting to MongoDB...\n',err);
                }
                console.log('Connected...');
                const collection = client.db("gaiabot").collection("ValAddrID");

                var query = '{ "chatID": ' + chatid + ', "ValAddr": \"' + valaddr + '\" }'
                var newvalue = { $set: {mute: false} }
                query = JSON.parse(query)
                // newvalue = JSON.parse(newvalue)
                // var query =

                if (collection.find(query)) {
                    collection.updateOne(query, newvalue, function(err, res) {
                        if(err) throw err
                        console.log("updated")
                        ctx.reply("Validator address " + cosvaladdr + " is unmuted")
                        client.close()
                    });
                } else {
                    ctx.reply("You didn't subscribe validator " + cosvaladdr + " yet")
                }
            });
        //})
    } else {
        ctx.reply("Wrong validator address, cannot be muted")
    }
})

module.exports = bot;
