import ConversationList from "@/components/chat/ConversationList";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

const Chat = () => {
  return (
    <div className="flex h-full">
      <ConversationList />
      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
};

export default Chat;
