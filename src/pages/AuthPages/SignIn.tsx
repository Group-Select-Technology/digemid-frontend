import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="SignIn Select Digemid"
        description="Inicia sesión en Select Digemid para acceder a tus medicamentos y más."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
