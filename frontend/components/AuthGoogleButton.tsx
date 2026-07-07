import { FcGoogle } from "react-icons/fc";
import {
  buildGoogleOAuthUrl,
  type GoogleAuthIntent,
} from "@/lib/googleAuth";

type AuthGoogleButtonProps = {
  intent: GoogleAuthIntent;
  label: string;
};

/** OAuth redirect button — same styling on login and signup. */
export default function AuthGoogleButton({ intent, label }: AuthGoogleButtonProps) {
  return (
    <a
      href={buildGoogleOAuthUrl(intent)}
      className="auth-google-button w-full min-w-0 max-w-full h-[42px] min-h-[42px] border border-white/80 rounded-md flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-3 text-sm font-medium bg-transparent text-white hover:bg-white hover:text-[#0c2b5a] transition box-border"
      aria-label={label}
    >
      <FcGoogle className="shrink-0 text-lg" aria-hidden />
      <span className="auth-google-button-label min-w-0 text-center leading-tight">
        {label}
      </span>
    </a>
  );
}
