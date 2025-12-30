import React from "react";
import { Button } from "@checkmate/ui";
import { Github, Mail, Chrome } from "lucide-react";

interface SocialProviderButtonProps {
  provider: string;
  displayName: string;
  onClick: () => void;
}

const getProviderIcon = (providerId: string) => {
  switch (providerId.toLowerCase()) {
    case "github": {
      return <Github className="h-4 w-4" />;
    }
    case "google": {
      return <Chrome className="h-4 w-4" />;
    }
    default: {
      return <Mail className="h-4 w-4" />;
    }
  }
};

export const SocialProviderButton: React.FC<SocialProviderButtonProps> = ({
  provider,
  displayName,
  onClick,
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
    >
      {getProviderIcon(provider)}
      <span className="ml-2">Continue with {displayName}</span>
    </Button>
  );
};
