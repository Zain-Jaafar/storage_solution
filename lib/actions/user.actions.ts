"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])],
  )
  
  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
}

const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();
  
  try {
    const session = await account.createEmailToken(ID.unique(), email);

    return session.userId;

  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
}

export const createAccount = async ({ fullName, email }: { fullName: string; email: string; }) => {
  const existingUser = await getUserByEmail(email);
  
  const accountId = await sendEmailOTP({ email });
  
  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId, 
      appwriteConfig.usersCollectionId, 
      ID.unique(), 
      {
        fullName, 
        email, 
        avatar: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F021%2F548%2F095%2Foriginal%2Fdefault-profile-picture-avatar-user-avatar-icon-person-icon-head-icon-profile-picture-icons-default-anonymous-user-male-and-female-businessman-photo-placeholder-social-network-avatar-portrait-free-vector.jpg&f=1&nofb=1&ipt=0bb45564e83e06bd588597e973c22b00b0d56f1c2d18822bc8052cbb38d5b8ec&ipo=images',
        accountId,
      },
    );
  }
  
  return parseStringify({ accountId });
}