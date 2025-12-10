---
title: "Writing a simple Slack bot using Node-RED"
date: "2019-07-10"
description: "Creating a Slack bot using Node-RED, a higher level visual programming tool"
tags: ["slack", "node-red", "nodejs", "bots", "escher"]
draft: false
---

**Slack** is probably the one of the best messaging apps used worldwide by small and large developer teams alike for _general communication, conferencing, sharing code etc_. But it brings something else to the table.

_Slack apps and bots_ are a super useful concept. These apps can range from small integrations such as _reminders, notes and storage_ to full _chat-ops support_ for large organisations.

Unfortunately, slack apps are infamously difficult to make. They require full dev-tools setup and hours invested in just reading up on the material to get acquainted with the slack development atmosphere. But it needn't be like this.

While there is no shortcut to full dev environments, the initial hustle can somewhat be eased up with the use of a _higher level visual programming tool like node-red_.

We'll start by gaining some background on the technology we're using and then straight away get started on making the bot.

## What is Node-Red ?

> Node-RED is a programming tool for wiring together hardware devices, APIs and online services in new and interesting ways.
>
> It provides a browser-based editor that makes it easy to wire together flows using the wide range of nodes in the palette that can be deployed to its runtime in a single-click.

Note that the most important part is that we are ' _wiring_' things together and making them work. This isn't just in the metaphorical sense, but in quite a literal way. We'll be ' _wiring_' our components together, which makes the process of programming a little easier.

## **Slack Apps**

I'm assuming that if you're developing for slack then you know a bit about it. Now, to make a bot for our workspace in slack, we have to follow a couple of (boring) steps to set up our bot:

1. Go to [https://api.slack.com/](https://api.slack.com/)
2. Click on **Your Apps**
3. Click on **Create New App**
4. Enter the _app name_ and choose the _workspace_ for which you'll develop. ( **NOTE**: Initially we will only be able to develop for our own workspace )

![](https://miro.medium.com/v2/resize:fit:700/1*w0MCZuc0zxIGfnZtc3nLqA.png)

5. Click on **Create App** to conclude the process

6. You'll come across something like this:

![](https://miro.medium.com/v2/resize:fit:700/1*NRFLnGb7SrKlwxOubCsJnw.png)

7. Now click on the **Bots** box.

![](https://miro.medium.com/v2/resize:fit:700/1*1iVNUDIRAPH79No7K7Driw.png)

8. Click on **Add a Bot User.** Set its name.

9. Now that the bot is set, we need to get its **token** in order to gain access to it. Go to **OAuth & Permissions**.

![](https://miro.medium.com/v2/resize:fit:700/1*KO7keZunjlSCT-tBLLSV2Q.png)

![](https://miro.medium.com/v2/resize:fit:700/1*kFwV0Pe6yx3wxFVkYbvNoQ.png)

10. Click on **Install App to Workspace.** You'll come across something like this

![](https://miro.medium.com/v2/resize:fit:700/1*ZKv-CQltsN3OPoelsktioA.png)

11. Copy the **Bot User OAuth Access Token** and save it somewhere.

### That's half of the tedious work done. We have successfully set up our app with our very own bot user. We will now use Node-RED to control the behaviour of this bot.

## Setting up Node-RED

To setup **Node-RED** on our system, we must have **Nodejs** and **Node Package Manager (NPM)** already set up on our system.

> [_Follow this link to set up Nodejs_](https://nodejs.org/en/download/)
>
> [_Follow this link to set up NPM_](https://www.npmjs.com/get-npm)
>
> [_Follow this link to set up Node-RED_](https://nodered.org/docs/getting-started/)

1. Open your terminal and _start the node-red localhost serve_ r. The`node-red` command runs the server on **localhost:1880** by default.

2. Open **localhost:1880** in your browser. You might see something like this:

![](https://miro.medium.com/v2/resize:fit:700/1*k-m3qevJZnwt6_KWbfsdGw.png)

To integrate **Node-RED** with **Slack API**, we have to install a package which helps connect it to slack using the **Bot User OAuth Access Token** mentioned previously.

Click on the hamburger icon in the top-right corner and select **Manage Palette.**

![](https://miro.medium.com/v2/resize:fit:516/1*JaGJIMhS1EWdR9W2RMnYgg.png)

Search for the keyword " _slack"_ in the **Install** tab. Install the package named **node-red-contrib-slack.**

![](https://miro.medium.com/v2/resize:fit:700/1*7W4AqlmNmrsBS2v7N1O6uw.png)

Close the menu.

Now that the package is installed, we can begin making our bot.

The first thing you'll notice is that some new blocks got added to the **social** tab in our Node-RED palette.

![](https://miro.medium.com/v2/resize:fit:700/1*bfu2CCOD6lVjIuN63LTsgg.png)

We only need to be concerned about two of the tabs here. The **slack-rtm-in** and **slack-web-out.**

The **slack-rtm-in** block gets activated whenever a message is sent on the workspace the bot has subscribed to. The **slack-web-out** block is responsible for sending messages on slack on the bot's behalf.

Go ahead and drag them into the workspace. Then double click on one of them to edit the properties.

![](https://miro.medium.com/v2/resize:fit:700/1*z0PuAHkaayqO8NTwmU944g.png)

Add a new slack config. Now copy and paste the **Bot User OAuth Access Token** you had saved earlier.

![](https://miro.medium.com/v2/resize:fit:700/1*Wcx71h1cCH6DKa2msDLJ6A.png)

Congrats ! Our bot has been successfully connected to node-red. Now we only have to design its behaviour.

## Defining Bot behaviour

Let's make our bot _echo_ back whatever we message it.

1. Drag a **function** block from the palette and connect it to **slack-rtm-in.** You can name it **filter-input.**

![](https://miro.medium.com/v2/resize:fit:530/1*AG-_nJ1MKqak2RNS1b_ZVQ.png)

2. Paste the following code in it.

```javascript
// ignore anything but messages
if (msg.payload.type != "message") {
    return null;
}// ignore deleted messages
if (msg.payload.subtype == "message_deleted") {
    return null;
}// ignore me_message
if (msg.payload.subtype == "me_message") {
    return null;
}// ignore bot_message
if (msg.payload.subtype == "bot_message") {
    return null;
}msg.user = {
    id: msg.payload.user,
    name: msg.payload.userObject.name
}msg.text = msg.payload.text
msg.channel = msg.payload.channel
return msg;
```

The code is pretty self-explanatory. All it does is filter the input received (input is in the form of events which are listened to by our bot) so that we only receive the message another user has sent to us either in our DM or a channel to which our bot is added.

The line **msg.channel = msg.payload.channel** finds out whether the message has been sent to DM (personal) or to a channel.

3. Drag another **function** block from the palette and connect it to the previous block. Paste the following code in it.

```javascript
msg.topic = "chat.postMessage"
msg.payload = {
    channel: msg.channel,
    text: msg.text
}
return msg;
```

4. Connect the **function** block with the **slack-web-out** block.

5. Click on the **Deploy** button on the top-right.

(NOTE: The **slack-rtm-in** and **slack-web-out** will show " _connected_" on deployment if everything is good)

![](https://miro.medium.com/v2/resize:fit:700/1*9lYpL-4Nkrl86DA4D0qJKw.png)

### Hurray ! Our first bot is ready.

Open slack and DM your bot.

![](https://miro.medium.com/v2/resize:fit:700/1*rzQXyFyBoevVllweYPxjCg.png)

You can also add your bot to a channel in your workspace and message it there. It will message you back on the channel.

![](https://miro.medium.com/v2/resize:fit:700/1*vVmZkNIuLszDYB2l1wjPfQ.png)

![](https://miro.medium.com/v2/resize:fit:700/1*Xij8dcyaNAJqZfjcFY2lXA.png)

## Conclusion

Hopefully you found Node-RED as interesting and easy to use as I did. The possibilities with this thing are endless if used properly.

Do let me know if you faced any kind of problem or doubts while setting this up.

Thanks for reading !
