import {
    HttpException,
    HttpStatus,
    UnauthorizedException,
  } from '@nestjs/common';
  import { TimeoutError } from 'rxjs';
  
  export async function handleHttpError(error: any) {
    if (error.response?.status === HttpStatus.UNAUTHORIZED) {
      throw new HttpException(error.response.data, HttpStatus.UNAUTHORIZED, {
        cause: error,
      });
    } else if (error instanceof TimeoutError) {
      throw new UnauthorizedException();
    } else {
      throw new UnauthorizedException();
    }
  }
  