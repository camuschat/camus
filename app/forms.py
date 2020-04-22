from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired


class RtcForm(FlaskForm):
    room_id = StringField('Room', validators=[DataRequired()])
    submit = SubmitField('Join')
