"""Retry utilities with exponential backoff for API calls"""
import asyncio
import functools
from typing import TypeVar, Callable, Any
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')

async def retry_with_backoff(
    func: Callable[..., T],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
) -> T:
    """
    Retry an async function with exponential backoff.
    
    Args:
        func: Async function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        backoff_factor: Multiplier for delay after each retry
        exceptions: Tuple of exceptions to catch and retry
        
    Returns:
        Result of the function call
        
    Raises:
        Last exception if all retries fail
    """
    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except exceptions as e:
            last_exception = e
            
            if attempt == max_retries:
                logger.error(f"All {max_retries} retries failed for {func.__name__}: {e}")
                raise
            
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed for {func.__name__}: {e}. Retrying in {delay}s...")
            await asyncio.sleep(delay)
            delay *= backoff_factor
    
    raise last_exception


def with_retry(max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0):
    """
    Decorator to add retry logic to async functions.
    
    Usage:
        @with_retry(max_retries=3, initial_delay=1.0)
        async def my_api_call():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_with_backoff(
                lambda: func(*args, **kwargs),
                max_retries=max_retries,
                initial_delay=initial_delay,
                backoff_factor=backoff_factor
            )
        return wrapper
    return decorator
