import { Routes } from "@angular/router";
import { LoginComponent } from "./components/login/login.component";
import { RegisterComponent } from "./components/register/register.component";
import { VerifyResidenceComponent } from "./components/verify-residence/verify-residence.component";
import { VerifyEmailComponent } from "./components/verify-email/verify-email.component";
import { ForgotPasswordComponent } from "./components/forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./components/reset-password/reset-password.component";

export const authRoutes: Routes = [
  {
    path: "login",
    component: LoginComponent,
    title: "Iniciar Sesión - Privium",
    data: {
      description:
        "Inicia sesión en tu cuenta de Privium para acceder al marketplace de tu barrio cerrado.",
      keywords: "login, iniciar sesión, privium, acceso, cuenta",
    },
  },
  {
    path: "register",
    component: RegisterComponent,
    title: "Registrarse - Privium",
    data: {
      description:
        "Crea tu cuenta en Privium y únete al marketplace exclusivo de tu barrio cerrado.",
      keywords: "registro, crear cuenta, privium, barrio cerrado, marketplace",
    },
  },
  {
    path: "verify-email",
    component: VerifyEmailComponent,
    title: "Verificar Email - Privium",
    data: {
      description:
        "Verifica tu dirección de email para completar el registro en Privium.",
      keywords: "verificación, email, activar cuenta, privium",
    },
  },
  {
    path: "verify-residence",
    component: VerifyResidenceComponent,
    title: "Verificar Residencia - Privium",
    data: {
      description:
        "Verifica tu residencia en un barrio cerrado para acceder a Privium.",
      keywords: "verificación, residencia, barrio cerrado, privium",
    },
  },
  {
    path: "forgot-password",
    component: ForgotPasswordComponent,
    title: "Recuperar Contraseña - Privium",
    data: {
      description:
        "Solicita un enlace para restablecer tu contraseña de Privium.",
      keywords: "contraseña, recuperar, restablecer, privium, seguridad",
    },
  },
  {
    path: "reset-password",
    component: ResetPasswordComponent,
    title: "Restablecer Contraseña - Privium",
    data: {
      description:
        "Cambia tu contraseña de Privium mediante el enlace enviado por correo.",
      keywords: "contraseña, restablecer, token, privium",
    },
  },
  { path: "", redirectTo: "login", pathMatch: "full" },
];
