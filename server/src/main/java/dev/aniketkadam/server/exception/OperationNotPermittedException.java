package dev.aniketkadam.server.exception;

public class OperationNotPermittedException extends Exception {
    public OperationNotPermittedException(String msg) {
        super(msg);
    }
}
