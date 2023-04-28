import { useState } from "react";
import "./App.css";
import ChatBox from "./components/ChatBox";
import UsernameField from "./components/ChatBox/Username";

function App() {
  const [username, setUsername] = useState<string>("");
  const [nameComplete, setNameComplete] = useState<boolean>(false);

  return !nameComplete ? (
    <UsernameField
      username={username}
      setUsername={setUsername}
      setNameComplete={setNameComplete}
    />
  ) : (
    <ChatBox username={username} />
  );
}

export default App;
