import { useEffect, useState } from "react";
import io from "socket.io-client";
import { Box, Button, FormControl, Grid, Input, Text } from "@chakra-ui/react";

const socket = io("http://localhost:3000");

type Message = string;
type ChatBoxProps = {
  username: string;
};

const ChatBox: React.FC<ChatBoxProps> = ({ username }) => {
  const [currentMessage, setMessage] = useState<Message>("");
  const [messages, setMessages] = useState<Message[]>([]);

  const search = window.location.search;
  const channelParams = new URLSearchParams(search);
  const channel = channelParams.get("channel");

  useEffect(() => {
    // loads messages
    socket.on("message", (message: Message) => {
      setMessages([...messages, message]);
    });
  }, [messages]);

  useEffect(() => {
    // joins channel
    if (channel !== "" && channel && username) {
      socket.emit("join", channel, username);
    }
  }, [channel, username]);

  const handleSendMessage = (message: Message) => {
    // sends message
    socket.emit("message", channel, message, username);
    setMessage("");
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
        >
          <Box display="flex" flexDirection="column">
            {messages &&
              messages.map((message: Message, index: number) => (
                <Text textAlign="left" key={index}>
                  {message}
                </Text>
              ))}
          </Box>
        </FormControl>
        <Box gridArea="sendMessageBox">
          <Grid templateRows="1fr auto" gap={2}>
            <FormControl>
              <Input
                value={currentMessage}
                onChange={(e) => setMessage(e.target.value)}
              />
            </FormControl>
            <Button onClick={() => handleSendMessage(currentMessage)}>
              Send Message
            </Button>
          </Grid>
        </Box>
      </Grid>
    </>
  );
};

export default ChatBox;
