from flask_wtf import FlaskForm
from wtforms import BooleanField, HiddenField, PasswordField, SelectField, StringField, SubmitField
from wtforms.validators import DataRequired


class RoomCreate(FlaskForm):
    room_name = StringField('Room name', validators=[DataRequired()])
    password = PasswordField('Room password (optional)')
    public = BooleanField('Public (i.e. listed to the right)')
    guest_limit = SelectField('Guest limit', coerce=int,
                               choices=[(2, '2'), (3, '3'), (4, '4'), (5, '5'), (0, 'No limit')])
    submit = SubmitField('Create')


class RoomJoin(FlaskForm):
    room_id = HiddenField()
    password = PasswordField('Password: ')
    submit = SubmitField('Join')
