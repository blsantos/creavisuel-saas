import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SiteContent, getContent, saveContent, resetContent, defaultContent } from "@/content/siteContent";

interface ContentContextType {
  content: SiteContent;
  updateContent: (newContent: SiteContent) => void;
  resetToDefault: () => void;
  isLoaded: boolean;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setContent(getContent());
    setIsLoaded(true);
  }, []);

  const updateContent = (newContent: SiteContent) => {
    setContent(newContent);
    saveContent(newContent);
  };

  const resetToDefault = () => {
    resetContent();
    setContent(defaultContent);
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, resetToDefault, isLoaded }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
};
