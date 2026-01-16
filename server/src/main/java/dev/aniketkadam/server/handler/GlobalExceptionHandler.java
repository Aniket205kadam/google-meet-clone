package dev.aniketkadam.server.handler;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.exception.RefreshTokenException;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import static org.springframework.http.HttpStatus.*;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(OperationNotPermittedException.class)
    public ResponseEntity<ExceptionResponse> exceptionHandler(OperationNotPermittedException exception) {
        return ResponseEntity
                .status(BAD_REQUEST)
                .body(ExceptionResponse.builder()
                        .message(exception.getMessage())
                        .businessErrorCode(BAD_REQUEST.value())
                        .build());
    }

    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<ExceptionResponse> exceptionHandler(RefreshTokenException exception) {
        return ResponseEntity
                .status(UNAUTHORIZED)
                .body(ExceptionResponse.builder()
                        .message(exception.getMessage())
                        .businessErrorCode(UNAUTHORIZED.value())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionResponse> exceptionHandler(MethodArgumentNotValidException exception) {
        Set<String> errors = new HashSet<>();
        exception.getBindingResult()
                .getAllErrors()
                .forEach(error -> errors.add(error.getDefaultMessage()));
        return ResponseEntity
                .status(BAD_REQUEST)
                .body(ExceptionResponse.builder()
                        .validationError(errors)
                        .build());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ExceptionResponse> exceptionHandler(EntityNotFoundException exception) {
        return ResponseEntity
                .status(NOT_FOUND)
                .body(ExceptionResponse.builder()
                        .message(exception.getMessage())
                        .businessErrorCode(NOT_FOUND.value())
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionResponse> exceptionHandler(Exception exception) {
        return ResponseEntity
                .status(INTERNAL_SERVER_ERROR)
                .body(ExceptionResponse.builder()
                        .message(exception.getMessage())
                        .businessErrorDescription(Arrays.toString(exception.getStackTrace()))
                        .businessErrorCode(INTERNAL_SERVER_ERROR.value())
                        .build());
    }
}
