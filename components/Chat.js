import React from "react";
const firebase = require("firebase");
require("firebase/firestore");
import { initializeApp } from "firebase/app";
import {
  Text,
  Button,
  View,
  TextInput,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { GiftedChat, Bubble } from "react-native-gifted-chat";

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      uid: "",
      user: {
        _id: "",
        name: "",
      },
    };
    //firebase info

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyAoyDUmDZISriQVw2m7YBBrss5ybzYbcYE",
        authDomain: "chatter-9d208.firebaseapp.com",
        projectId: "chatter-9d208",
        storageBucket: "chatter-9d208.appspot.com",
        messagingSenderId: "952212377442",
        appId: "1:952212377442:web:e1ae1c8c90408dd7b7263b",
      });
    }
    // Reference to Firestore collection
    this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    //  go through each document
    querySnapshot.forEach((doc) => {
      //get the QueryDocumentSnapshot's data
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
        },
      });
    });
    this.setState({
      messages,
    });
  };

  componentDidMount() {
    // Set name as title chat
    let { name } = this.props.route.params;
    this.props.navigation.setOptions({ title: name });

    // Reference to load firebase messages
    this.referenceChatMessages = firebase.firestore().collection("messages");

    // Authenticate user anonymously
    this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        messages: [],
        user: {
          _id: user.uid,
          name: name,
        },
      });
      this.unsubscribe = this.referenceChatMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });
  }
  componentWillUnmount() {
    this.unsubscribe();
  }

  onSend(messages = []) {
    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }));
    () => {
      this.addMessages(this.state.messages[0]);
    };
  }

  addMessages = (message) => {
    this.referenceChatMessages.add({
      uid: this.state.uid,
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      user: message.user,
    });
  };
  // chat bubble customization
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#000",
          },
        }}
      />
    );
  }
  render() {
    // routing username and background color from home component.
    let name = this.props.route.params.name;
    let { color } = this.props.route.params;

    return (
      <View style={[{ backgroundColor: color }, styles.container]}>
        <Text>{this.state.name} </Text>
        {Platform.OS === "android" ? (
          <KeyboardAvoidingView behavior="height" />
        ) : null}

        {/* GiftedChat Components */}
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: this.state.user._id,
            name: name,
          }}
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
