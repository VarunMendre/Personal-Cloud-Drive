import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|in|io|co|info|biz)$/
    ),
  password: z
    .string("please enter a valid password")
    .regex(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
      "Password should contain 1 special character of minimum 8 characters"
    ),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(5, "Should contain at least 5 characters").max(100),
  otp: z
    .string("Please Enter a valid 4 digit OTP")
    .regex(/^\d{4}$/, "OTP must be exactly 4 digits and contain only numbers"),
});

export const otpSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|in|io|co|info|biz)$/
    ),
  otp: z
    .string("Please Enter a valid 4 digit OTP")
    .regex(/^\d{4}$/, "OTP must be exactly 4 digits and contain only numbers"),
});
