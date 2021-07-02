const keep_alive = require('./keep_alive.js')
const {
  token,
  prefix,
  guild,
  mainCategory,
  logs,
  mainServer
} = require("./settings.json");

const {
  Client,
  Message,
  MessageEmbed,
  MessageAttachment,
} = require("discord.js");
const client = new Client();

//customizable snippets 
const snippets = require("./snippets.json");

//ready event
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

//message event
client.on("message", async (message) => {
  if (message.author.bot) return; // return if message is sent by a bot
  const args = message.content.slice(prefix.length).trim().split(/ +/g); //splitting args
  const mainGuild = client.guilds.cache.get(guild); //server where the threads are created
  const modMailLogs = mainGuild.channels.cache.get(logs); //modmail logs are sent here

  //only create threads if it is a DM message
  if (message.channel.type === "dm") {
    checkAndSave(message);
    //checking if channel for author already exists in the modmail category
    const checkChannel = !!mainGuild.channels.cache.find(
      (ch) => ch.topic === message.author.id
    );
    //if exists, send in existing
    if (checkChannel === true) {
      const mailChannel = await mainGuild.channels.cache.find(
        (ch) => ch.topic === message.author.id
      );
      //if message is an attachment
      if (message.attachments && message.content === "") {
        message.react('✅')
        mailChannel.send(
          new MessageEmbed()
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setColor("BLUE")
            .setImage(message.attachments.first().proxyURL)
            .setTimestamp()
        );
      }
      //if message is a text message 
      else {
        message.react('✅')
        mailChannel.send(
          new MessageEmbed()
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setColor("BLUE")
            .setDescription(message.content)
            .setTimestamp()
        );
      }
    }
    //modmail thread channel does not exist 
    else if (checkChannel === false) {
      //create a thread under the mainCategory (can be modified in "./settings.json")
      const mailChannel = await mainGuild.channels.create(`${message.author.tag}`, {
        type: "text",
        topic: message.author.id,
        parent: mainCategory,
      });
      //pinging the modmail role on the creation of a new thread. 
      mailChannel.send(
        `**<@${message.author.id}>** has created a new thread!\n\n**${prefix}reply <message>** - Reply to the thread\n**${prefix}close** - Close the modmail thread\n\nPlease refer to <#846189527302144020> for snippets shortcuts available.`
      );

      //logging the creation of the thread. LogChannel can be changed in "./settings.json"
      modMailLogs.send(
        new MessageEmbed()
          .setDescription(
            `\`${message.author.tag}\` has created a new thread [${mailChannel}] \`${mailChannel.name}\``
          )
          .setColor(`GREEN`)
          .setTimestamp()
      );
      //DMing the author on successfully creating the thread
      message.author.send(
        new MessageEmbed()
          .setAuthor(client.user.tag, client.user.displayAvatarURL())
          .setTitle("Thread Created!")
          .setDescription(
            `Thank you for reaching out to our staff team, ${message.author.username}! They will be contacting you as soon as they can! Meanwhile you can further elaborate your questions/issues if needed.`
          )
          .setColor(`RANDOM`)
          .setTimestamp()
          .setFooter(`This is an automated message from Designing Cosmos`)
      ).catch((e)=>{
          return console.log(e.message); 
      })
      //if message content is an attachment
      if (message.attachments && message.content === "") {
        message.react('✅')
        mailChannel.send(
          new MessageEmbed()
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setColor("BLUE")
            .setImage(message.attachments.first().proxyURL)
            .setTimestamp()
        );
      }
      //if message content is plain text 
      else {
        message.react('✅')
        mailChannel.send(
          new MessageEmbed()
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setColor("BLUE")
            .setDescription(message.content)
            .setTimestamp()
        );
      }
    }
  }

  //switching to staff replies
  if (!message.guild) return; //returning if message is in DMs

  //info command
  if (message.content === `${prefix}info` || message.content === `${prefix}information`) {
    message.channel.send(
      new MessageEmbed()
        .setTitle("Modmail Bot")
        .setDescription(
          "Hi there! Modmail bot is designated for members to DM it whenever they have any questions or need help. "
        )
        .setColor("BLUE")
        .setTimestamp()
    );
  }
  //checking if the thread handling commands are in the staff server only and are under the modmail category (wont work elsewhere)
  if (
    message.guild.id === mainGuild.id &&
    message.channel.parentID === mainCategory &&
    !message.author.bot
  ) {
    //ID of author who created the thread
    let firstAuthorID = message.channel.topic; 
    //the main server (not the one in which threads are created)
    let zCafe = client.guilds.cache.get(mainServer);
    //getting the author who created the thread by ID
    let firstAuthorMember = zCafe.members.cache.get(firstAuthorID);

    //close command- closes the current thread with a timeout of 5s
    if (message.content === `${prefix}close`) {
      await message.channel
        .send(
          new MessageEmbed()
            .addField(
              `Thread closed`,
              `This channel will be deleted in 5 seconds`
            )
            .setColor("RED")
            .setFooter(`Closed by ${message.author.tag}`)
        )
        .catch(console.error);
      //deleting after 5 seconds
      setTimeout(async () => {
        //if member left the main guild
        if (!firstAuthorMember)
          return message.channel.send(
            `Couldn't send close confirmation to member. They might've left the server...`
          );
        await firstAuthorMember
          .send(
            new MessageEmbed()
              .setTitle("Thread Closed")
              .setDescription(
                "This thread has been closed by our staff team. Replying to this message will create a new thread. Feel free to contact us if you need any help again :blush:"
              )
              .setColor("RED")
              .setAuthor(client.user.tag, client.user.displayAvatarURL())
              .setTimestamp()
              .setFooter("This is an automated message from Designing Cosmos")
          )

        //logging thread close
        await modMailLogs
          .send(
            new MessageEmbed()
              .addField(
                `Thread closed`,
                `Thread with ID \`#${firstAuthorID}\` closed by \`${message.author.tag}\``
              )
              .setColor("RED")
              .setTimestamp()
          )
          .catch(console.error);
        await message.channel.delete().catch(console.error);
        sendTranscriptAndDelete(message, modMailLogs);
      }, 5000); 
    //   ^^^^^ timeout can be changed by changing that (TIME IN MILLISECONDS)
      return;
    } //end of close command

    //pre-defined snippet commands
    //snippets can be fully customized from "./snippets.json"
    if (message.content.startsWith(prefix)) {
      var reply;
      let snippetEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter("Designing Cosmos Community Team")
        .setColor("GREEN");
      if (args[0].toLowerCase() === "r" || args[0].toLowerCase() === "reply") {
        //no reply stated
        if (!args[1]) return;
        //staff reply
        reply = args.slice(1).join(" ");
        //member not found
        if (!firstAuthorMember)
          return message.channel.send(
            `Couldn't reply as member might have left the server`
          );
        const replyEmbed = new MessageEmbed()
          .setAuthor(message.author.tag, message.author.displayAvatarURL())
          .setDescription(reply)
          .setTimestamp()
          .setColor("GREEN")
          .setFooter("Designing Cosmos Community Team");
        try {
          await message.delete();
          await message.channel.send(replyEmbed);
          await firstAuthorMember.send(replyEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        } 
      } else if (args[0].toLowerCase() === "hi") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        )
        .setDescription(snippets.hi)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "transferred") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.transferred)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "accept") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.accept)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "reject") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.reject)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "canthelp") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.canthelp)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "delay") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.delay)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "tyforsending") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.tyforsending)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "designpending") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.designpending)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "closing") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.closing)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "applydesigner") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.applydesigner)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "describe") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.describe)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "reported") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ) .setDescription(snippets.reported)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "morehelp") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.morehelp)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else if (args[0].toLowerCase() === "noreply") {
        snippetEmbed.setAuthor(
          message.author.tag,
          message.author
            .displayAvatarURL({ dynamic: true })
        ).setDescription(snippets.noreply)
        try {
          await message.delete();
          await message.channel.send(snippetEmbed);
          await firstAuthorMember.send(snippetEmbed);
        } catch (e) {
          console.log(`${e.message}`);
        }
      } else {
        return;
      }
    }
  }
});
//functions
async function checkAndSave(message) {
  db.findOne({ AuthorID: message.author.id }, async (err, data) => {
    if (err) throw err;
    if (data) {
      if (message.attachments && message.content === "") {
        data.Content.push(
          `${message.author.tag} : ${message.attachments.first().proxyURL}`
        );
      } else {
        data.Content.push(`${message.author.tag} : ${message.content}`);
      }
    } else {
      if (message.attachments && message.content === "") {
        data = new db({
          AuthorID: message.author.id,
          Content: `${message.author.tag} : ${
            message.attachments.first().proxyURL
          }`,
        });
      } else {
        data = new db({
          AuthorID: message.author.id,
          Content: `${message.author.tag} : ${message.content}`,
        });
      }
    }
    data.save();
  });
}

async function sendTranscriptAndDelete(message, channel) {
  db.findOne({ AuthorID: message.channel.name }, async (err, data) => {
    if (err) throw err;
    if (data) {
      fs.writeFileSync(
        `../${message.channel.name}.txt`,
        data.Content.join("\n\n")
      );
      await channel.send(
        new MessageAttachment(
          fs.createReadStream(`../${message.channel.name}.txt`)
        )
      );
      fs.unlinkSync(`../${message.channel.name}.txt`);
      await db.findOneAndDelete({ AuthorID: message.channel.name });
    }
  });
}

//login
client.login(token);
