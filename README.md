python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python manage.py makemigrations

python manage.py migrate

python manage.py runserver

python manage.py createsuperuser

npm install -g @angular/cli

ng serve
