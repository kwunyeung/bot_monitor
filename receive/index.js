const Telegraf = require('telegraf')
const mongo = require('mongodb')
const util = require('util')
const exec = util.promisify(require('child_process').exec)


const MongoClient = require('mongodb').MongoClient, test = require('assert');

const uri = "mongodb+srv://sherry:MfsiAta5p@cluster0-2etvy.gcp.mongodb.net/BotData";


const bot = new Telegraf(process.env.BOT_TOKEN)

const cosvaladdrpattern = RegExp(/cosmosvaladdr[a-z0-9]{39}/)

bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('This is a bot that will notify you when something happened in the Forbole chain (fb-001). You have to subscribe validators'))
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
    ctx.reply(`Which validator would you like to subscribe?`)
    return next(ctx).then(() => {
        var correct = 0

        bot.hears(/^cosmosvaladdr[a-z0-9]{39}$/i, (ctx) => {
            // send address and chat id to mongoDB
            // get charid and valaddr

            var chatid = ctx.message.chat.id
            var cosvaladdr = ctx.message.text
            var cmd_debug = 'fbdebug addr ' + cosvaladdr + ' | grep Address | cut -d " " -f2'

            run_cmd(cmd_debug).then(function(result){
                valaddr = valaddr.replace(/\n/, '')
                MongoClient.connect(uri, function(err, client) {
                    if(err) {
                        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
                    }
                    console.log('Connected...');
                    const collection = client.db("BotData").collection("ValAddrID");
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

            })
        })
    })
});

bot.command("/mute", async(ctx, next) => {
    var chatid = ctx.message.chat.id
    var text = ctx.message.text
    var texts = text.split(' ')
    cosvaladdr = texts[1]

    if (typeof cosvaladdr == 'undefined') {
        ctx.reply("Usage: /mute [cosmosvaladdress]")
    }
    else if (cosvaladdrpattern.test(cosvaladdr)) {

        var cmd_debug = 'fbdebug addr ' + cosvaladdr + ' | grep Address | cut -d " " -f2'
        run_cmd(cmd_debug).then(function(result){
            valaddr = valaddr.replace(/\n/, '')

            // if (cosvaladdrpattern.test(cosvaladdr)) {
            // if validatoraddr exists in the db, change mute to true
            MongoClient.connect(uri, function(err, client) {
                if(err) {
                    console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
                }
                console.log('Connected...');
                const collection = client.db("BotData").collection("ValAddrID");

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
        })
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
        ctx.reply("Usage: /unmute [cosmosvaladdress]")
    }
    else if (cosvaladdrpattern.test(cosvaladdr)) {

        var cmd_debug = 'fbdebug addr ' + cosvaladdr + ' | grep Address | cut -d " " -f2'
        run_cmd(cmd_debug).then(function(result){
            valaddr = valaddr.replace(/\n/, '')

            // if (cosvaladdrpattern.test(cosvaladdr)) {
            // if validatoraddr exists in the db, change mute to true
            MongoClient.connect(uri, function(err, client) {
                if(err) {
                    console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
                }
                console.log('Connected...');
                const collection = client.db("BotData").collection("ValAddrID");

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
        })
    } else {
        ctx.reply("Wrong validator address, cannot be muted")
    }
})

module.exports = bot;
