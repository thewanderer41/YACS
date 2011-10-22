from django.core.management.base import BaseCommand
from yacs.courses.bridge import import_courses
from optparse import make_option

class Command(BaseCommand):
    help = "Downloads the course data and imports it into the database."
    option_list = BaseCommand.option_list + (
        make_option('--force', '-f', dest='force', action='store_true',
            help='Force update of all semesters.'),
    )

    def handle(self, *args, **options):
        if options.get('force'):
            print "Forcing update..."
        import_courses(force=options.get('force', False))
