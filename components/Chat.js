import React from "react";
import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomActions from "./CustomActions";
import MapView from "react-native-maps";

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

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: "",
        name: "",
        image: null,
        location: null,
      },
      isConnected: false,
      image: null,
      location: null,
    };

    /**firebase info */
    const firebaseConfig = {
      apiKey: "AIzaSyAoyDUmDZISriQVw2m7YBBrss5ybzYbcYE",
      authDomain: "chatter-9d208.firebaseapp.com",
      projectId: "chatter-9d208",
      storageBucket: "chatter-9d208.appspot.com",
      messagingSenderId: "952212377442",
      appId: "1:952212377442:web:e1ae1c8c90408dd7b7263b",
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    /**Reference to Firestore collection */
    this.referenceChatMessages = firebase.firestore().collection("messages");
    currentUserMessages = null;
  }

  componentDidMount() {
    /**Set name as title chat */
    let { name } = this.props.route.params;
    this.props.navigation.setOptions({ title: name });

    /**Authenticate user anonymously */
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        await firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        messages: [],
        user: {
          _id: user.uid,
          name: name,
        },
      });
      this.currentUserMessages = firebase
        .firestore()
        .collection("messages")
        .where("uid", "==", user.uid);
    });
    /**   Reference to load firebase messages
     this.referenceChatMessages = firebase.firestore().collection("messages"); */

    this.unsubscribe = this.referenceChatMessages
      .orderBy("createdAt", "desc")
      .onSnapshot(this.onCollectionUpdate);

    /**verify internet connection */
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });
        console.log("online");
        console.log(this.state.isConnected);
      } else {
        console.log("offline");
      }
    });
  }

  async getMessages() {
    let messages = "";
    try {
      messages = (await AsyncStorage.getItem("messages")) || [];
      this.setState({
        messages: JSON.parse(messages),
      });
    } catch (error) {}
  }

  async saveMessages() {
    try {
      await AsyncStorage.setItem(
        "messages",
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem("messages");
      this.setState({
        messages: [],
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  /**
   * renders the input toolbar library.
   * @param {object} props
   * @returns
   */
  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
      this.getMessages();
    } else {
      return <InputToolbar {...props} />;
    }
  }

  /**
   * Renders the custom actions component where a user can share picture/video/location.
   * @param {object} props
   * @returns
   */
  renderCustomActions = (props) => <CustomActions {...props} />;

  /**
   * Update a users collection.
   * @param {object} querySnapshot
   */
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    /**go through each document */
    querySnapshot.forEach((doc) => {
      /**get the QueryDocumentSnapshot's data */
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
        },
        image: data.image || null,
        location: data.location || null,
      });
    });
    this.setState({
      messages,
    });
  };

  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * Adding a message to the users chat window.
   */
  addMessage() {
    const message = this.state.messages[0];

    this.referenceChatMessages.add({
      uid: this.state.uid,
      _id: message._id,
      createdAt: message.createdAt,
      text: message.text || "",
      user: this.state.user,
      image: message.image || null,
      location: message.location || null,
    });
  }

  /**
   * Sends a message to the chat window.
   * @param {array} messages
   */
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }

  /** chat bubble customization */
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

  /**
   * Function to display region sharing
   * @param {object} props
   * @returns location data.
   */
  renderCustomView = (props) => {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      );
    }
    return null;
  };

  render() {
    /**routing username and background color from home component. */
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
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: this.state.user._id,
            name: name,
          }}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
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
