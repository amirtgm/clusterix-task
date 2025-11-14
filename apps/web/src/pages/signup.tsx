import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SignupForm } from "@/components/signup-form";

export function SignupPage() {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate("/news");
  };

  const handleSignupError = (message: string) => {
    toast.error(message);
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm
          onSuccess={handleSignupSuccess}
          onAuthError={handleSignupError}
        />
      </div>
    </div>
  );
}
