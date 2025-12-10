---
title: "Building a chat system with Flutter and Cloud Firestore"
date: "2020-01-31"
description: "How to build a chat system in flutter under 20 minutes"
tags: ["flutter", "cloud-firestore", "mobile-chat-application", "firebase", "tutorial"]
draft: false
---

![](https://miro.medium.com/v2/resize:fit:700/1*XEi_70b2tph6vyZ_XQLc9w.png)

Flutter is one of the most trending platforms for mobile development in 2020. It is one of the easiest ways to code complex applications with good UI.

To gain experience in **Flutter**, we decided to do recreate our former app, _Pivot_, in flutter, with an added feature, the _global chatroom,_ where users could hang out and talk about different topics.

We decided to use a simple **Cloud Firestore** backend. The full project can be accessed using the link below:

[**pd-escher/pivot\_2**](https://github.com/pd-escher/pivot_2)

A mobile student portal for ICAS made with Flutter Place where students can view their timetable and major updates and…

### Setup

Before using Firebase, it has to be configured. First, it has to be [added to the flutter project](https://firebase.google.com/docs/flutter/setup?platform=android).

> A file named "google-services.json" will be downloaded and added to the project folder.

After that, the [_pubspec.yaml_](https://github.com/pd-escher/pivot_2/blob/master/pubspec.yaml) file has to be changed to add _Firebase_ and _Cloud Firestore_ plugins.

> NOTE: The latest version of dependencies might have to be changed in the future.

The details of [_firebase authentication_](https://github.com/pd-escher/pivot_2/blob/master/lib/root_page.dart) are discussed in a separate blog, but they can be found in the Github repo as well.

## Chat Backend

The backend is pretty simple. It consists of a [**Collection**](https://firebase.google.com/docs/firestore/data-model) of **Chats.**

### Schema

Each chat entry contains:

_content:_ The contents in the chat

_idFrom:_ Id of the user who submitted the chat

_timestamp:_ Time at which the message was sent

![Collection of Chats Firebase](https://miro.medium.com/v2/resize:fit:700/1*X00hzcVmQiuuSioY-PSVmw.png)

Whenever a new **chat** is sent, it will be added to the **Chats** collection.

## Frontend

Now that the backend is established. It is time to map each [**document**](https://firebase.google.com/docs/firestore/data-model) in the chat collection with its **frontend counterpart**.

Its basic structure is given below.

![Frontend Components](https://miro.medium.com/v2/resize:fit:700/1*ViEK6Ev047jOcCIUh2zpZA.png)

> **NOTE:** Click on the subheadings to directly go to the code.

### [Chat](https://github.com/pd-escher/pivot_2/blob/master/lib/Chat/chat.dart)

This component is responsible for managing the entire state of the chat. It has two sub-components:

- ChatScreen.dart
- ChatSender.dart

### [ChatScreen](https://github.com/pd-escher/pivot_2/blob/master/lib/Chat/ChatScreen.dart)

This sub-component is responsible for loading the chat from the firebase backend and displaying a list of **ChatItem** s.

A [**StreamBuilder**](https://api.flutter.dev/flutter/widgets/StreamBuilder-class.html) has been used for the process so that the chat screen is instantly updated when an entry is _added, changed_ or _deleted_ in the backend.

### [ChatItem](https://github.com/pd-escher/pivot_2/blob/master/lib/Chat/ChatItem.dart)

This is the GUI counterpart of every **Chat**( **document**) in the **Chats** collection.

Defining the **ChatItem** separately increases the modularity of the code. We can change the appearance of each **ChatItem** with ease.

### [ChatSender](https://github.com/pd-escher/pivot_2/blob/master/lib/Chat/ChatSender.dart)

This component allows the user to send their chat.

It consists of a [TextField](https://api.flutter.dev/flutter/material/TextField-class.html) and an [IconButton](https://api.flutter.dev/flutter/material/IconButton-class.html). The TextField is assigned a TextEditingController to manage its UI state and update it with user input.

### Sending Message to Firebase Collection

When the button is clicked, the _sendMessage()_ method is called, which in turn takes the current value of the _TextEditingController_ and calls the _onSendMessage()_ method.

```dart
void sendMessage() {
    onSendMessage(textEditingController.text);
}
```

The _onSendMessage()_ method accepts a **String** as a parameter and adds it to the ' **Chat**' collection in Cloud Firestore.

## Conclusion

This concludes a simple and easy implementation of a _global chatroom_ using **Cloud Firestore** and **Flutter.**
