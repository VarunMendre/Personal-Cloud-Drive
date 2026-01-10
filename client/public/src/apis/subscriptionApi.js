import { axiosWithCreds } from "./axiosInstances";



export const createSubscription = async (planId) => {
  const { data } = await axiosWithCreds.post("/subscriptions", { planId });
  return data;
};

export const getSubscriptionDetails = async () => {
  const { data } = await axiosWithCreds.get("/subscriptions/details");
  return data;
};

export const getInvoiceUrl = async () => {
  const { data } = await axiosWithCreds.get("/subscriptions/invoice");
  return data;
};

export const cancelSubscription = async (planId) => {
  const { data } = await axiosWithCreds.post("/subscriptions/cancel", { planId });
  return data;
};

export const checkSubscriptionStatus = async (subscriptionId) => {
  const { data } = await axiosWithCreds.get(`/subscriptions/status/${subscriptionId}`);
  return data;
};

export const getEligiblePlans = async () => {
  const { data } = await axiosWithCreds.get("/subscriptions/eligible-plans");
  return data;
};

export const upgradeSubscription = async (planId) => {
  const { data } = await axiosWithCreds.post("/subscriptions/change-plan", { planId });
  return data;
};
