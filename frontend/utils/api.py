import hashlib
import json
import time
import traceback
from urllib.parse import urljoin

import requests
from utils.env import ENV_CONFIGS

_api_cache = {}


def _cache_get(key):
    entry = _api_cache.get(key)
    if not entry:
        return None
    value, expiry = entry
    if time.time() > expiry:
        del _api_cache[key]
        return None
    return value


def _cache_set(key, value, ttl=60):
    _api_cache[key] = (value, time.time() + ttl)
    _api_cache[key] = (value, time.time() + ttl)


def _api_request(
    method, endpoint, params=None, body=None, headers=None, auth=None, cache_ttl=None
):
    url = urljoin(
        f"{ENV_CONFIGS['BASE_URL'].rstrip('/')}/{ENV_CONFIGS['API_VERSION'].rstrip('/')}/",
        endpoint.lstrip("/"),
    )

    cache_key = None
    if cache_ttl and not ENV_CONFIGS["DEBUG"]:
        raw_key = json.dumps(
            {"method": method, "url": url, "params": params, "body": body},
            sort_keys=True,
        )
        cache_key = hashlib.md5(raw_key.encode()).hexdigest()
        cached = _cache_get(cache_key)
        if cached:
            return {**cached, "cached": True}

    try:
        res = requests.request(
            method,
            url=url,
            params=params,
            json=body,
            headers=headers,
            auth=auth,
            timeout=(2, 10),
        )
        result = {
            "data": res.json(),
            "error": None,
            "status": res.status_code,
        }
        if cache_ttl and cache_key is not None and not ENV_CONFIGS["DEBUG"]:
            _cache_set(cache_key, result, ttl=cache_ttl)
        return result
    except requests.HTTPError as http_err:
        if ENV_CONFIGS["DEBUG"]:
            print(traceback.format_exc())
        return {
            "data": None,
            "error": f"HTTP {http_err.response.status_code}: {http_err.response.text}",
            "status": http_err.response.status_code,
        }
    except requests.RequestException as err:
        if ENV_CONFIGS["DEBUG"]:
            print(traceback.format_exc())
        return {
            "data": None,
            "error": str(err),
            "status": None,
        }


def api_get(endpoint, params=None, headers=None, auth=None):
    return _api_request(
        "GET",
        endpoint=endpoint,
        params=params,
        headers=headers,
        auth=auth,
        cache_ttl=60,
    )


def api_post(endpoint, body=None, headers=None, auth=None):
    return _api_request(
        "POST", endpoint=endpoint, body=body, headers=headers, auth=auth, cache_ttl=120
    )


def api_put(endpoint, body=None, headers=None, auth=None):
    return _api_request(
        "PUT", endpoint=endpoint, body=body, headers=headers, auth=auth, cache_ttl=120
    )


def api_delete(endpoint, params=None, body=None, headers=None, auth=None):
    return _api_request(
        "DELETE",
        endpoint=endpoint,
        params=params,
        body=body,
        headers=headers,
        auth=auth,
    )
