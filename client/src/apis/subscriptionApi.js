import { axiosWithCreds } from "./axiosInstances";



export const createSubscription = async (planId) => {
  const { data } = await axiosWithCreds.post("/subscriptions", { planId });
  return data;
};

export const getSubscriptionDetails = async () => {
  const { data } = await axiosWithCreds.get("/subscriptions/details");
  return data;
};
