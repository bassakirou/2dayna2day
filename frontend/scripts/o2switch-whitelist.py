"""Temporary SSH firewall access; never removes existing user exceptions."""
import ipaddress
import json
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.request

state = pathlib.Path(os.environ['RUNNER_TEMP']) / '2day-whitelist.json'

def api(action, **params):
    server = os.environ['CPANEL_SERVER']
    user = os.environ['CPANEL_USERNAME']
    if not re.fullmatch(r'[a-zA-Z0-9.-]+', server) or not re.fullmatch(r'[a-zA-Z0-9_]+', user):
        raise RuntimeError('Configuration cPanel invalide')
    request = urllib.request.Request(
        f'https://{server}:2083/execute/SshWhitelist/{action}?' + urllib.parse.urlencode(params),
        headers={'Authorization': f"cpanel {user}:{os.environ['CPANEL_API_TOKEN']}"},
    )
    with urllib.request.urlopen(request, timeout=55) as response:
        data = json.load(response)
    if data.get('status') != 1 or data.get('errors'):
        raise RuntimeError(f'Action pare-feu {action} refusée ; consulter cPanel.')
    return data.get('data') or {}

if sys.argv[1] == 'add':
    with urllib.request.urlopen('https://api.ipify.org', timeout=20) as response:
        address = str(ipaddress.IPv4Address(response.read().decode().strip()))
    entries = api('list').get('list', [])
    existing = [e['direction'] for e in entries if e.get('address') == address and str(e.get('port')) == '22']
    # Record before mutation so cleanup also runs after an uncertain API response.
    state.write_text(json.dumps({'address': address, 'remove': [d for d in ['in', 'out'] if d not in existing]}))
    if set(existing) != {'in', 'out'}:
        api('add', address=address, port=22)
    print('Autorisation SSH du runner vérifiée.')
elif sys.argv[1] == 'cleanup':
    if state.exists():
        data = json.loads(state.read_text())
        for direction in data['remove']:
            api('remove', address=data['address'], port=22, direction=direction)
        state.unlink()
    print('Nettoyage de l’exception SSH terminé.')
else:
    raise RuntimeError('Action inconnue')
