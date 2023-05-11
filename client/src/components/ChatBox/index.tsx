import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Box, Button, FormControl, Grid, Input, Text } from "@chakra-ui/react";

// const socket = io("http://localhost:3000");
const socket = io("35.172.231.110:3000");

type Message = string;
type ChatBoxProps = {
  username: string;
};

type MessageFormat = {
  type: string;
  content: string;
  username: string;
};

const ChatBox: React.FC<ChatBoxProps> = ({ username }) => {
  const [currentMessage, setCurrentMessage] = useState<Message>("");
  const [messages, setMessages] = useState<MessageFormat[]>([]);
  const [channel, setChannel] = useState<string>("waiting-room");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(true);
  // const search = window.location.search;
  // const channel = channelParams.get('channel');

  useEffect(() => {
    // loads messages
    socket.on("message", (message: MessageFormat) => {
      setMessages([...messages, message]);
      setShouldScroll(true);
    });
  }, [messages]);

  useEffect(() => {
    // joins channel
    if (channel && username) {
      socket.emit("join", channel, username);
    }
  }, [channel, username]);

  useEffect(() => {
    socket.on("changeChannel", (newChannel: string) => {
      setChannel(newChannel);
    });
  }, [channel]);

  useEffect(() => {
    // Scroll to the bottom when shouldScroll is true
    if (shouldScroll && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  const handleSendMessage = () => {
    // sends message
    if (currentMessage === "") return;

    socket.emit("message", channel, currentMessage, username);
    setCurrentMessage("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      <Grid
        templateColumns="500px"
        templateRows="1fr auto"
        gap={4}
        templateAreas="
          'messagesLabel'
          'sendMessageBox'
        "
      >
        <FormControl
          as={Box}
          gridArea="messagesLabel"
          width="500px"
          height="calc(50vh)"
          style={{ overflowY: "auto" }}
          ref={messagesContainerRef}
        >
          <Box display="flex" flexDirection="column">
            {messages &&
              messages.map((message: MessageFormat, index: number) => {
                switch (message.type) {
                  case "message":
                    return (
                      <Text
                        textAlign="left"
                        key={index}
                        color={
                          username === message.username ? "green" : "orange"
                        }
                      >
                        {message.content}
                      </Text>
                    );
                  case "connection":
                    return (
                      <Text textAlign="left" key={index} color="gray">
                        {message.content}
                      </Text>
                    );
                  case "bid":
                    return (
                      <Text textAlign="left" key={index} color="blue">
                        {message.content}
                      </Text>
                    );
                  case "reject":
                    return (
                      <Text textAlign="left" key={index} color="red">
                        {message.username === username
                          ? "You rejected a bid."
                          : message.content}
                      </Text>
                    );
                }
              })}
          </Box>
        </FormControl>
        <Box gridArea="sendMessageBox">
          <Grid templateRows="1fr auto" gap={2}>
            <FormControl>
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </FormControl>
            <Button onClick={() => handleSendMessage()}>Send Message</Button>
          </Grid>
        </Box>
      </Grid>
    </>
  );
};

export default ChatBox;
