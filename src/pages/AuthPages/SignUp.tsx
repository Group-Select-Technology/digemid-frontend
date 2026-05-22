import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="SignUp Select Digemid"
        description="Regístrate en Select Digemid para acceder a tus medicamentos y más."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
