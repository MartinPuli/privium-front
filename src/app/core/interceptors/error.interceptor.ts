import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, throwError } from "rxjs";
import {
  ResultSnackbarComponent,
  SnackData,
} from "src/app/shared/components/result-snackbar/result.snackbar.component";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log(error);
      let errorMessage = "Ha ocurrido un error inesperado";

      if (error.error?.messages[0]?.message) {
        errorMessage = error.error.messages[0].message;
      }

      // Mostrar el error en un snackbar
      snackBar.openFromComponent<ResultSnackbarComponent, SnackData>(
        ResultSnackbarComponent,
        {
          data: { message: errorMessage, status: "error" },
          duration: 5000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
          panelClass: ["error", "offset-80"]
        }
      );

      return throwError(() => error);
    })
  );
};
