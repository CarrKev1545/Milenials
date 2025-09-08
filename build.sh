#!/usr/bin/env/ bash

set -0 errexit

pip install -7 requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate