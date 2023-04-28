import { Box, Button, FormControl, Grid, Input } from "@chakra-ui/react";

type UsernameProps = {
  username: string;
  setUsername: (username: string) => void;
  setNameComplete: (complete: boolean) => void;
};

const UsernameField: React.FC<UsernameProps> = ({
  username,
  setUsername,
  setNameComplete,
}) => {
  return (
    <Box gridArea="sendMessageBox">
      <Grid templateRows="1fr auto" gap={2}>
        <FormControl>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </FormControl>
        <Button onClick={() => setNameComplete(true)}>Set Username</Button>
      </Grid>
    </Box>
  );
};

export default UsernameField;
