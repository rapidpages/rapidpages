import { env } from "process";
import Stripe from "stripe";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", {
  // https://github.com/stripe/stripe-node#configuration
  // https://stripe.com/docs/api/versioning
  apiVersion: "2024-04-10",
  // Register this as an official Stripe plugin.
  // https://stripe.com/docs/building-plugins#setappinfo
  appInfo: {
    name: "Rapidpages Designer",
    version: "0.1.0",
    url: "https://rapidpages.com",
  },
});
