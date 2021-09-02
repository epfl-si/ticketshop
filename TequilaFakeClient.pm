#!/usr/bin/perl
#
##############################################################################
#
# File Name:    Tequila/Client.pm
# Description:  Encapsule l'authentification Tequila pour les CGI en perl
# Author:       Claude Lecommandeur (Claude.Lecommandeur@epfl.ch)
# Date Created: Thu Oct 31 09:16:06 CET 2002
#
# 2.0.1 -> 2.0.2
#   - Remove all remnant of opaque ans urlauth.
#   - Fix localorg image access. Now, it is logo.gif.
#
# 2.0.2 -> 2.0.3
#   - In loadargs : protect from multiple 'key' values.
#   - Remove all remnant of 'fromserver'.
#   - Fetch images from server.
#
# 2.0.2 -> 2.0.3
#   - Fix for ever the key business. Now there is a separateket for the request
#     and session.
#   - No longer use the key= attribute in the urlaccess, always use cookies.
#
# 2.0.3 -> 2.0.4
#   - Check session key validity (/^[a-z0-9]+$/).
#
# 2.0.4  -> 2.0.5
#   - REALLY Check session key validity.
#   - Improve search of sessions directory.
#
# 2.0.5  -> 2.0.6
#   - Improve random initialization.
#   - Fix bug in key calculation that never uses '9'.
#
#
##############################################################################
#
package Tequila::Client;
#
use strict;
use Socket;
use IO::Socket::SSL;
use IO::Socket::INET;

use vars qw(@ISA $VERSION $XS_VERSION $CONFIG $DEBUG);

my ($defaultserver, $defaultserverurl, $defaultsessionsdir);

$VERSION = '2.0.6';

sub new { # Exported
  my $class = shift;
  my  %args = @_;

  staticinit ();
  my  $self = {
            partner => undef,
           resource => undef,
           urlacces => undef,
          urlaccess => undef,
             usessl => 1,
            service => undef,
            request => undef,
               wish => undef,
            require => undef,
          wantright => undef,
           wantrole => undef,
           language => 'english',
         identities => undef,
        localserver => $defaultserver,
          serverurl => $defaultserverurl,
         serverfile => "/tequila",
        usesessions => 1,
        sessionsdir => $defaultsessionsdir,
    sessionsmanager => undef,
         sessionmax => 24 * 3600,
  checkcertificates => 0,
             cafile => undef,
         clientargs => {},
             allows => undef,
       authstrength => 0,
          hascookie => 0,
         usecookies => 1,
         cookiename => undef,
       cookiepolicy => 'session',
      servercookies => 1,
       allsensitive => undef,
           username => undef,
            contact => undef,
            testing => undef,
              debug => undef,
          logouturl => undef,

            verbose => 0,
      authenticated => undef,
        initialized => undef,
        querystring => undef,
           pathinfo => undef,
         scriptname => undef,
         servername => undef,
         serverport => undef,
              https => undef,
         sessionkey => undef,
         requestkey => undef,
                org => undef,
               user => undef,
               host => undef,
               vars => undef,
              attrs => undef,
            appargs => undef,
  };
  foreach my $arg (keys %args) {
    if (ref ($args {$arg}) eq 'ARRAY') {
      $self->{$arg} = join ('+', @{$args {$arg}});
      next;
    }
    $self->{$arg} = $args {$arg};
  }
  $self->{urlaccess} ||= $self->{urlacces};
  bless $self, $class;
  #$self->init (); # Too dangerous.
  return $self;
}

sub init {
  my $self = shift;
  return if $self->{initialized};
  my $appargs = loadargs ();

  $self->{querystring} = $ENV {QUERY_STRING};
  $self->{pathinfo}    = $ENV {PATH_INFO};
  $self->{scriptname}  = $ENV {SCRIPT_NAME};
  $self->{servername}  = $ENV {SERVER_NAME};
  $self->{serverport}  = $ENV {SERVER_PORT};
  $self->{https}       = $ENV {HTTPS};
  $self->{appargs}     = $appargs;

  if ($self->{usecookies}) {
    $self->{sessioncookiename} ||= $self->{cookiename};
    unless ($self->{sessioncookiename}) {
      my $scriptname = $self->{scriptname};
      if ($scriptname =~ /^.*\/(\S+)$/) {
        $self->{sessioncookiename} = "Tequila_$1";
      } else {
        $self->{sessioncookiename} = 'teqsession_key';
      }
    }
    unless ($self->{requestcookiename}) {
      my $scriptname = $self->{scriptname};
      if ($scriptname =~ /^.*\/(\S+)$/) {
        $self->{requestcookiename} = "Tequila_req_$1";
      } else {
        $self->{requestcookiename} = 'teqrequest_key';
      }
    }
    my $sessioncookiename = $self->{sessioncookiename};
    my $requestcookiename = $self->{requestcookiename};
    my $allcookies = $ENV {HTTP_COOKIE};
    foreach my $cookie (split (/; /, $allcookies)) {
      if ($cookie =~ /^\Q$sessioncookiename\E=(.*)$/) {
        $self->{sessionkey} = $1;
        $self->{hascookie}  = 1;
        last;
      }
      if ($cookie =~ /^\Q$requestcookiename\E=(.*)$/) {
        $self->{requestkey} = $1;
        last;
      }
    }
  } else {
    $self->{sessionkey} ||= $appargs->{tequila_key} || $appargs->{key};
    delete $appargs->{tequila_key};
    delete $appargs->{key};
  }
  $self->{initialized} = 1;

  my $FAKE_TEQUILA = $ENV{FAKE_TEQUILA} || 0;
  warn "TequilaFakeClient: FAKE_TEQUILA=$FAKE_TEQUILA\n"; 
  if ($FAKE_TEQUILA) {
    $self->{attrs} = {
      'provider' => '',
      'firstname' => 'Fake',
      'authorig' => 'cookie',
      'status' => 'ok',
      'name' => 'Tequila',
      'uniqueid' => $ENV{FAKE_TEQUILA} || "169419",
      'requesthost' => '192.168.224.82',
      'authstrength' => 1
    };
    $self->{authenticated} = 1;
  }
}

sub authenticate {
  my $self = shift;
  return if $self->{authenticated};
  init ($self) unless $self->{initialized};
  if ($self->authenticated ()) {
    $self->{attrs}->{authstrength} ||= 0;
    if ($self->{attrs}->{authstrength} >= $self->{authstrength}) {
      return;
    }
  }
  $self->{requestkey} = $self->createserverrequest ();
  $self->redirecttoserver ();
}

sub authenticated {
  my $self = shift;
  return 1 if $self->{authenticated};
  init ($self) unless $self->{initialized};

  if ($self->{sessionkey}) {
    if ($self->{usesessions} && ($self->loadsession () == 1)) {
      if ($self->checkuserprofile ()) {
        $self->depositcookie ($self->{sessioncookiename}, $self->{sessionkey})
          if (!$self->{hascookie} && $self->{usecookies});
        $self->{authenticated} = 1;
      } else { return; }
    } else { return; }
  }
  elsif ($self->{requestkey}) {
    $self->removecookie ($self->{requestcookiename});
    if ($self->fetchattributes ()) {
      $self->depositcookie ($self->{sessioncookiename}, $self->{sessionkey})
        if $self->{usecookies};
      $self->{authenticated} = 1;
    } else { return; }
  }
  return $self->{authenticated};
}

sub logout {
  my $self = shift;
  $self->killsession () if $self->{usesessions};
  $self->{authenticated} = 0;
  $self->removecookie ($self->{sessioncookiename});
}

sub globallogout {
  my $self = shift;
  $self->logout ();
  my        $pi = $self->{pathinfo};
  my        $me = $self->{scriptname};
  my        $us = $self->{servername};
  my $serverurl = $self->{serverurl};
  my $logouturl = $self->{logouturl} || $self->{urlaccess} || "http://$us$me$pi";
  $logouturl    = escapeurl ($logouturl);
  print qq{Location: $serverurl/logout?urlaccess=$logouturl\r\n\r\n};
}

sub redirecttoserver {
  my $self = shift;
  my $requestkey = $self->{requestkey};
  $self->error ("Internal error in redirecttoserver : requestkey undefined.")
    unless $requestkey;
  $self->removecookie  ($self->{sessioncookiename});
  $self->depositcookie ($self->{requestcookiename}, $self->{requestkey});
  print qq{WWW-Authenticate: Tequila serverurl="$self->{serverurl}" requestkey="$requestkey"\r\n};
  print qq{Location: $self->{serverurl}/auth?requestkey=$requestkey\r\n\r\n};
  exit;
}

sub loadsessionsmanager {
  my $self = shift;
  my $sessionsmanager = $self->{sessionsmanager};
  my $SM = 'Tequila::' . $sessionsmanager;
  eval "use $SM; 1;" || do {
    warn "loadsessionsmanager ($sessionsmanager) failed1.\n" if $self->{verbose};
    $self->error ("loadsessionsmanager : Unable to load session manager $SM : $@");
  };
  my $sm;
  eval "\$sm = new $SM (dsmhost => 'localhost', dsmport => 2345);" || do {
    warn "loadsessionsmanager ($sessionsmanager) failed2.\n" if $self->{verbose};
    $self->error ("loadsessionsmanager : Unable to initialized session manager $SM : $@");
  };
  $self->{sm} = $sm;
  warn "loadsessionsmanager ($sessionsmanager) OK.\n" if $self->{verbose};
}

sub createsession {
  my $self = shift;
  checksessionkey ($self, $self->{sessionkey});
  warn "createsession ($self->{sessionsdir}:$self->{sessionkey}:$self->{org}".
       ":$self->{user}:$self->{host})" if $self->{verbose};
  
  if ($self->{sessionsmanager}) {
    $self->loadsessionsmanager () unless $self->{sm};
    my $sm = $self->{sm};
    return unless $sm;
    my $session = {
          org => $self->{org},
         user => $self->{user},
         host => $self->{host},
      timeout => $self->{sessionmax}
    };
    foreach my $attr (keys %{$self->{attrs}}) {
      my $value = $self->{attrs}->{$attr};
      $value =~ s/\n/\\n/g;
      $value =~ s/\r]//g;
      $session->{$attr} = $value;
    }
    my $status = $sm->createsession ("Application:$self->{sessionkey}", $session);
    unless ($status) {
      $self->error ("createsession : Unable to create session Application:$self->{sessionkey}");
    }
    warn "createsession : session $self->{sessionkey} created\n" if $self->{verbose};
    return 1;
  } else {
    return $self->createfilesession ();
  }
}

sub createfilesession {
  my $self = shift;
  warn "createfilesession ($self->{sessionsdir}:$self->{sessionkey}:$self->{org}".
       ":$self->{user}:$self->{host})" if $self->{verbose};
  
  checksessionkey ($self, $self->{sessionkey});
  my $sesdir = $self->{sessionsdir};
  unless (-d $sesdir && -w $sesdir) {
    $self->error ("Tequila:createsession: Session directory xxx $sesdir doesn't ".
                  "exist or not writable.");
  }
  unless (open (SESSION, ">$sesdir/$self->{sessionkey}")) {
    $self->error ("Tequila:createsession: Unable to open session file ".
                  "($sesdir/$self->{sessionkey}) : $!");
  }
  print SESSION
    "org=$self->{org}\n",
    "user=$self->{user}\n",
    "host=$self->{host}\n"
    ;
  foreach my $attr (keys %{$self->{attrs}}) {
    my $value = $self->{attrs}->{$attr};
    $value = "\\\n" . $value . "\n" if ($value =~ /[\n\r]/);
    print SESSION "$attr=$value\n";
  }
  close (SESSION);
  return 1;
}

#
# loadsession
#
# returns : 1 : OK.
#           2 : pas de session.
#           3 : session échue.
#           4 : pas la bonne machine au bout
#
sub loadsession {
  my $self = shift;
  return 2 unless $self->{sessionkey};
  checksessionkey ($self, $self->{sessionkey});

  if ($self->{sessionsmanager}) {
    $self->loadsessionsmanager () unless $self->{sm};
    my $sm = $self->{sm};
    return unless $sm;
    warn "loadsession ($self->{sessionkey} OK\n" if $self->{verbose};
    my $session = $sm->readsession ("Application:$self->{sessionkey}");
    return 2 unless $session;
    foreach my $attr (keys %$session) {
      $self->{$attr} = $session->{$attr};
    }
    return 1;
  } else {
    return $self->loadfilesession ();
  }
}

sub loadfilesession {
  my       $self = shift;
  my $sessionkey = $self->{sessionkey};
  my     $sesdir = $self->{sessionsdir};
  my     $sesmax = $self->{sessionmax};

  return 2 unless $self->{sessionkey};
  checksessionkey ($self, $self->{sessionkey});

  my $keyfile = "$sesdir/$sessionkey";
  return 2 unless (-r $keyfile);
  my $lastaccess = (stat ($keyfile))[8];
  my        $now = time;
  if ($lastaccess < ($now - $sesmax)) {
    unlink ($keyfile);
    return 3;
  }
  open (SESSION, $keyfile) || return 2;
  while (<SESSION>) {
    chomp;
    my ($attr, $value) = split (/=/, $_, 2);
    if ($attr =~ /^(org|user|host)$/) {
      $self->{$attr} = $value;
      next;
    }
    if ($value =~ /^\\/) {
      $value = "\\\n";
      while (<SESSION>) {
        last if /^[\r\n]*$/;
        $value .= $_;
      }
    }
    $self->{attrs}->{$attr} = $value;
  }
  close (SESSION);
  utime ($now, $now, "$sesdir/$sessionkey");
  killsession ($self) unless $self->{usesessions};
  return 1;
}

sub checkuserprofile {
  my      $self = shift;
  my     $abort = shift;
  my   $require = $self->{require};
  my  $resource = $self->{resource};
  my $wantright = $self->{wantright};
  my  $wantrole = $self->{wantrole};

  return 1 if ($self->{attrs}->{status} eq 'fail'); # Don't check failed login.
  if ($resource && ($resource ne $self->{attrs}->{resource})) {
    return 0 if !$abort;
    $self->error (
      "Tequila:checkuserprofile: request found on the server, doesnt match the".
      " requested resource :".
      "<br>server says resource = $self->{attrs}->{resource},".
      "<br>client says resource = $resource");
  }
  if ($require && ($require ne $self->{attrs}->{require})) {
    return 0 if !$abort;
    $self->error (
      "Tequila:checkuserprofile: request found on the server, doesnt fit the".
      " required filter :".
      "<br>server says require = $self->{attrs}->{require},".
      "<br>client says require = $require");
  }
  if ($wantright) {
    my @rights = split (/,/, $wantright);
    foreach my $right (@rights) {
      unless ($self->{attrs}->{$right}) {
        return 0 if !$abort;
        $self->error (
          "Tequila:checkuserprofile: request found on the server, doesnt fit the".
          " required filter : right $right is missing");
      }
    }
  }
  if ($wantrole) {
    my @roles = split (/,/, $wantrole);
    foreach my $role (@roles) {
      unless ($self->{attrs}->{$role}) {
        return 0 if !$abort;
        $self->error (
          "Tequila:checkuserprofile: request found on the server, doesnt fit the".
          " required filter : role $role is missing");
      }
    }
  }
  return 1;
}

sub purgesessions {
  my $self = shift;
  return if $self->{sessionsmanager};
  my $sesmax = $self->{sessionmax};
  opendir (SESSIONS, $self->{sessionsdir}) || return;
  my @sessions = readdir (SESSIONS);
  closedir (SESSIONS);
  @sessions = grep (!/^\.\.?$/, @sessions);
  foreach my $session (@sessions) {
    my $sessionfile = "$self->{sessionsdir}/$session";
    next if -d $sessionfile;
    my $lastaccess = (stat ($sessionfile))[8];
    my        $now = time;
    unlink ($sessionfile) if ($lastaccess < ($now - $sesmax));
  }
}

sub killsession {
  my $self = shift;
  checksessionkey ($self, $self->{sessionkey});
  if ($self->{sessionsmanager}) {
    $self->loadsessionsmanager () unless $self->{sm};
    my $sm = $self->{sm};
    return unless $sm;
    $sm->deletesession ("Application:$self->{sessionkey}");
  } else {
    my $sessionfile = "$self->{sessionsdir}/$self->{sessionkey}";
    unlink ($sessionfile) || "killsession: Unable to kill session $self->{sessionkey} : $!";
  }
}

sub request {
  my $self = shift;
  $self->{request} = join ('+', @_);
}

sub wish {
  my $self = shift;
  $self->{wish} = join ('+', @_);
}

sub require {
  my   $self = shift;
  my $newreq = shift;
  if ($self->{require}) {
    $self->{require} = "($self->{require})&($newreq)";
  } else {
    $self->{require} = $newreq;
  }
}

sub authstrength {
  my $self = shift;
  $self->{authstrength} = shift;
}

sub checkcerts {
  my $self = shift;
  $self->{checkcertificates} = shift;
}

sub cafile {
  my $self = shift;
  $self->{cafile} = shift;
}

sub wantright {
  my $self = shift;
  $self->{wantright} = shift;
}

sub wantrole {
  my $self = shift;
  $self->{wantrole} = shift;
}

sub setresource {
  my $self = shift;
  $self->{resource} = shift;
}

sub setpartner {
  my $self = shift;
  $self->{partner} = shift;
}

sub setlang {
  my $self = shift;
  $self->{language} = shift;
}

sub setidentities {
  my $self = shift;
  $self->{identities} = shift;
}

sub allsensitive {
  my $self = shift;
  my $value = shift;
  $self->{allsensitive} = $value ? 1 : 0;
}

sub usecookies {
  my $self = shift;
  my $value = shift;
  $self->{usecookies} = $value ? 1 : 0;
}

sub setcookiename {
  my $self = shift;
  $self->{cookiename} = $self->{sessioncookiename} = shift;
}

sub setcookiepolicy {
  my $self = shift;
  $self->{cookiepolicy} = shift;
}

sub useloginwindow {
  # nothing.
}

sub servercookies {
  my $self = shift;
  $self->{servercookies} = shift;
}

sub setopaque {
  # nothing
}

sub setserver {
  my   $self = shift;
  my $server = shift;
  $self->{localserver} = $server;

  my $binaddr = gethostbyname ($server);
  my $srvaddr = join ('.', unpack ('C4', $binaddr));
  $self->{sessionsdir} = $self->{sessionsdir} . '/' . $srvaddr;
  $self->{serverurl}   = "https://$self->{localserver}/tequila";
}

sub setserverurl {
  my      $self = shift;
  my $serverurl = shift;

  $self->{serverurl} = $serverurl;
  if ($serverurl =~ m!^(http|https)://([^/]*)(.*)$!) {
    my ($host, $file) = ($2, $3);
    $host = $1 if $host =~ /^([^:]*):(.*)$/;
    $self->{localserver} = $host;
    $self->{serverfile}  = $file;
  }
  my $binaddr = gethostbyname ($self->{localserver});
  my $srvaddr = join ('.', unpack ('C4', $binaddr));
  $self->{sessionsdir} = $self->{sessionsdir} . '/' . $srvaddr;
}

sub getserverurl {
  my $self = shift;
  return $self->{serverurl};
}

sub setlogouturl {
  my $self = shift;
  $self->{logouturl} = shift;
}

sub usessl {
  my $self = shift;
  $self->{usessl} = shift;
}

sub allows {
  my ($self, $allow) = @_;
  $self->{allows} .= '&' if $self->{allows};
  $self->{allows} .= $allow;
}

sub setusername {
  my $self = shift;
  $self->{username} = shift;
}

sub setorg {
  my $self = shift;
  $self->{org} = shift;
}

sub setservice {
  my $self = shift;
  $self->{service} = shift;
}

sub setclientarg {
  my ($self, $key, $value) = @_;
  $self->{clientargs}->{$key} = $value;
}

sub getclientarg {
  my ($self, $key) = @_;
  return $self->{clientargs}->{$key};
}

sub usesessions {
  my $self = shift;
  $self->{usesessions} = shift;
}

sub setsessionsdir {
  my $self = shift;
  $self->{sessionsdir} = shift;
}

sub getsessionsdir {
  my $self = shift;
  return $self->{sessionsdir};
}

sub setsessionsduration {
  my $self = shift;
  $self->{sessionmax} = shift;
}

sub getsessionsduration {
  my $self = shift;
  return $self->{sessionmax};
}

sub loadargs {
  my  $clen = $ENV {CONTENT_LENGTH};
  my  $meth = $ENV {REQUEST_METHOD};
  my   $get = $ENV {QUERY_STRING};

  my $args;
  my $post = '';
  if ($meth eq 'POST') {
    read STDIN, $post, $clen;
    my $ctype = $ENV {CONTENT_TYPE};
    if ($ctype =~ /^multipart\/form-data;\s+boundary=(.*)$/) {
      my $boundary = $1;
      my @parts = split (/$boundary/, $post);
      shift @parts; pop @parts;

      my $pat1 = qq{\r\nContent-Disposition: form-data; name="(.*?)"};
      my $pat2 = qq{\r\nContent-Type: (.*?)\r\n\r\n(.*)};
      foreach my $part (@parts) {
        if($part =~ /^$pat1\r\n\r\n(.*)\r\n/is) {
          my  $name = $1;
          my $value = $2;
          $args->{$name} = $value;
          next;
        }
        if ($part =~ /^$pat1; filename="(.*?)"$pat2\r\n/is) {
          my     $name = $1;
          my $filename = $2; $filename =~ s/.*\\//; $filename =~ s/.*\///;
          my    $ctype = $3;
          my  $content = $4; $content =~ s/!$//;
          $args->{$name} = {
               filename => $filename,
            contenttype => $ctype,
                content => $content,
          };
          next;
        }
        if ($part =~ /^$pat1; filename="(.*?)"\r\n(.*)\r\n/is) {
          my     $name = $1;
          my $filename = $2; $filename =~ s/.*\\//; $filename =~ s/.*\///;
          my  $content = $3; $content =~ s/!$//;
          $args->{$name} = {
               filename => $filename,
            contenttype => "unknown",
                content => $content,
          };
          next;
        }
      }
      $post = '';
    }
  }
  my $all = $get . '&' . $post;
  my @fields = split (/&/, $all);
  foreach (@fields) {
    s/\+/ /g;
    s/%([0-9a-f]{2,2})/pack ("C", hex ($1))/gie;
  }
  foreach my $field (@fields) {
    next unless ($field =~ /=/);
    my ($key, $value) = split(/=/, $field, 2);
    next unless $value;
    if ($key eq 'key') {
      $args->{$key} = $value;
    } else {
      my $oldval = $args->{$key};
      $args->{$key} = $oldval ? "$oldval,$value" : $value;
    }
  }
  return $args;
}

sub parseargs {
  my $qstr = shift;
  return unless $qstr;

  my $args;
  my @fields = split (/&/, $qstr);
  foreach (@fields) {
    s/\+/ /g;
    s/%([0-9a-f]{2,2})/pack ("C", hex ($1))/gie;
  }
  foreach my $field (@fields) {
    next unless ($field =~ /=/);
    my ($key, $value) = split (/=/, $field, 2);
    my $oldval = $args->{$key};
    $args->{$key} = $oldval ? "$oldval,$value" : $value;
  }
  return $args;
}

sub head {
  my $title = shift || 'Tequila';
  print qq{Content-Type: text/html;charset=iso-8859-1

      <html>
        <head>
          <title>$title</title>
        </head>
        <body>
  };
}

sub tail {
  print qq{
        </body>
      </html>
  };
  exit;
}

sub error {
  my ($self, $msg1, $testing, $msg2) = @_;
  my $server = $self->{localserver};
  head ('Tequila error');
  print qq{
      <table width="100%" height="100%"><tr><td valign="middle">
        <table width="600" border="1" cellspacing="0" align="center" cellpadding="5">
          <tr>
            <td bgcolor="#CCCCCC">
              <table width="100%">
                <tr>
                  <td>
                    <img src="http://$server/images/logo.gif" alt="Local logo">
                  </td>
                  <td bgcolor="#CCCCCC" align="right">
                    <font size="+2">Service <b>$self->{service}</b></font>
                  </td>
                </tr>
              </table>
            </td>
          </tr>  
          <tr>
            <td align="center"> 
              <table width="98%" cellspacing="0" bgcolor=white>
                <tr>
                  <td width="219">
                    <img src="http://$server/images/eye.gif" width="200" height="270">
                  </td>
                  <td align="center" valign="middle">
                    <font color="red" size="+1">
                      Tequila error : $msg1
                      <h3 align="center">
                        Contact the manager of the application you
                        are trying to access.
                      </h3>
                    </font>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td></tr></table>
  };
  tail ();
}

sub getaddrs {
  my $srv = shift;
  my ($name, $aliases, $addrtype, $length, @addresses) = gethostbyname ($srv);
  next unless @addresses;
  foreach (@addresses) {
    $_ = join ('.', unpack ('C4', $_));
  }
  return @addresses;
}

sub createserverrequest {
  my   $self = shift;
  $self->{urlaccess} = $self->makeurlaccess () unless $self->{urlaccess};
  $self->{usecookie} = $self->{servercookies} ? '' : 'off';

#
#  We should use method POST, but we get trapped in the Apache infamous
#  Method Not Allowed message.
#
  my $method = 'GET';
  #my $method = 'POST';
  my $args;
  if ($self->{resource}) {
    $args->{resource} = $self->{resource};
    $args->{partner}  = $self->{partner} if $self->{partner};
  } else {
    foreach my $keyword (qw(partner resource origresource urlaccess service username
                allows allsensitive request wish require wantright forcelogin
                wantrole language identities usecookie authstrength debug allowedorgs
                nochecksrchost charset)) {
      next unless $self->{$keyword};
      $args->{$keyword} = $self->{$keyword};
      $args->{$keyword} = escapeurl ($args->{$keyword}) if ($method eq 'GET');
    }
  }
  foreach my $key (keys %{$self->{clientargs}}) {
    next if $args->{$key};
    my $value = $self->{clientargs}->{$key};
    $value = escapeurl ($value) if ($method eq 'GET');
    $args->{$key} = $value;
  }
  $args->{dontappendkey} = 1 if $self->{usecookies};
  my    $server = $self->{localserver};
  my    $script = $self->{serverfile};
  my $serverurl = $self->{serverurl} || "http://$server$script";
  $serverurl    =~ s/\/tequila(\/|$)/\/tequilac$1/ if $self->{resource} || $self->{partner};
  $serverurl    =~ s/^http:/https:/ if $self->{checkcertificates} ||
                                       $self->{resource}          ||
                                       $self->{partner}           ||
                                       $self->{usessl};
  my ($status, $sock, $statusline) =
    $self->httpsocket ("$serverurl/createrequest", $method, $args);

  $self->error ("Bad connection to Tequila server ($serverurl), server says : $statusline")
    if ($status != 200);

  my $requestkey;
  my $nempty = 0;
  while (<$sock>) { # body
    last unless $_;
    s/^[\r\n]*$//;
    if (/^$/) {
      last if (++$nempty > 5);
    } else { $nempty = 0; }
    $requestkey = $1 if /^key=(.*)$/;
  }
  close ($sock);
  $self->error ("Bad response from local Tequila server ($server)") if !$requestkey;
  return $requestkey;
}

sub fetchattributes {
  my       $self = shift;
  my $requestkey = $self->{requestkey};
  my     $server = $self->{localserver};
  my  $serverurl = $self->{serverurl} || "http://$server/tequila";
  $serverurl     =~ s/\/tequila(\/|$)/\/tequilac$1/ if $self->{resource} || $self->{partner};
  $serverurl     =~ s/^http:/https:/ if $self->{checkcertificates} ||
                                       $self->{resource}          ||
                                       $self->{partner}           ||
                                       $self->{usessl};

  my $args = { key => $requestkey, };
  my ($status, $sock, $statusline) =
    $self->httpsocket ("$serverurl/fetchattributes", 'GET', $args);

  return if ($status == 451); # Invalid key.
  $self->error ("Bad connection to Tequila server ($serverurl), server says : $statusline")
    if ($status != 200);

  my ($org, $user, $host, $key, $sver, %attrs);
  while (<$sock>) { # body
    last unless $_;
    chomp;
    next if /^$/;
    if (/^([^=]+)=(.*)$/) {
      my ($name, $value) = ($1, $2);
      if    ($name eq     'org') { $org  = $value; }
      elsif ($name eq    'user') { $user = $value; }
      elsif ($name eq    'host') { $host = $value; }
      elsif ($name eq     'key') { $key  = $value; }
      elsif ($name eq 'version') { $sver = $value; }
      else {
        if ($value =~ /^\\/) {
          $value = '';
          while (<$sock>) {
            last if /^[\r\n]*$/;
            $value .= $_;
          }
        }
        $attrs {$name} = $value;
      }
    }
  }
  close ($sock);
  $self->error ("Tequila:fetchattributes: Malformed server response : org undefined")
    unless $org;
  $self->error ("Tequila:fetchattributes: Malformed server response : user undefined")
    unless $user;
  $self->error ("Tequila:fetchattributes: Malformed server response : host undefined")
    unless $host;
  $self->error ("Tequila:fetchattributes: Malformed server response : key undefined")
    unless $key;

  $self->{org}     = $org;
  $self->{user}    = $user;
  $self->{host}    = $host;
  $self->{version} = $sver;
  $self->{attrs}   = \%attrs;

  $self->checkuserprofile (1);
  if ($self->{usesessions}) {
    $self->{sessionkey} = $self->genkey ();
    $self->createsession ();
  }
  return 1;
}

sub makeurlaccess () {
  my  $self = shift;
  my    $qs = $self->{querystring};
  my    $pi = $self->{pathinfo};
  my    $me = $self->{scriptname};
  my    $us = $self->{servername};
  my $proto = ($self->{https} && ($self->{https} eq 'on')) ? "https" : "http";
  my $urlaccess = "$proto://$us$me$pi";
  $urlaccess .= "?$qs" if $qs;
  return $urlaccess;
}

sub depositcookie {
  my ($self, $cook, $value) = @_;
  return unless $cook;
  my $date = gmtime (time + $self->{sessionmax});
  my ($day, $month, $daynum, $hms, $year) = split (/\s+/, $date);
  my $expires = sprintf ("%s %02d-%s-%s %s GMT", $day, $daynum, $month, $year, $hms);
  if ($self->{cookiepolicy} eq 'session') {
    print qq{Set-Cookie: $cook=$value; path=/;\r\n};
  } else {
    print qq{Set-Cookie: $cook=$value; path=/; expires=$expires;\r\n};
  }
}

sub removecookie {
  my ($self, $cook) = @_;
  my $date = gmtime (time - 3600);
  my ($day, $month, $daynum, $hms, $year) = split (/\s+/, $date);
  my $expires = sprintf ("%s %02d-%s-%s %s GMT", $day, $daynum, $month, $year, $hms);
  print qq{Set-Cookie: $cook=removed; path=/; expires=$expires;\r\n};
}

sub staticinit {
  my ($localserver, $serverurl, $sessionsdir);
  if (open (CONF, "/etc/tequila.conf")) {
    while (<CONF>) {
      chomp;
      next if (/^#/ || /^$/);
      $localserver = $1 if /^TequilaServer:\s*(.*)$/i;
      $serverurl   = $1 if /^TequilaServerUrl:\s*(.*)$/i;
      $sessionsdir = $1 if /^SessionsDir:\s*(.*)$/i;
    }
    close (CONF);
  }
  unless ($sessionsdir) {
    if (eval "use Tequila::Config; 1;") {
      $localserver = $Tequila::Config::server;
      $serverurl   = $Tequila::Config::serverurl;
      $sessionsdir = $Tequila::Config::sessionsdir;
    }
  }
  
  my @tried;
  unless ($sessionsdir) {
    my $scriptfile = $ENV {SCRIPT_FILENAME};
    $scriptfile =~ s/\/[^\/]*$//;
    my $sesdir = "$scriptfile/config/Sessions";
    push (@tried, $sesdir);
    if (-d $sesdir && -w $sesdir) {
      $sessionsdir = $sesdir;
    }
  }
  unless ($sessionsdir) {
    my @sessionsdirs = (
      '/var/www/Tequila/Sessions',
      '/var/www/tequila/Tequila/Sessions',
    );
    foreach my $sesdir (@sessionsdirs) {
      push (@tried, $sesdir);
      if (-d $sesdir && -w $sesdir) {
        $sessionsdir = $sesdir;
        last;
      }
    }
  }
  my $sesdir = $ENV {DOCUMENT_ROOT};
  unless ($sessionsdir) { 
    $sesdir =~ s!/[^/]*/*$!/Sessions!;  # One step over DOCUMENT_ROOT.
    push (@tried, $sesdir);
    if (-d $sesdir && -w $sesdir) {
      $sessionsdir = $sesdir;
    }
  }
  unless ($sessionsdir) { 
    $sesdir =~ s!/Sessions$!/Tequila/Sessions!;
    push (@tried, $sesdir);
    if (-d $sesdir && -w $sesdir) {
      $sessionsdir = $sesdir;
    }
  }
  unless ($sessionsdir) { 
    $sesdir =~ s!/Tequila/Sessions$!/private/Tequila/Sessions!;
    push (@tried, $sesdir);
    if (-d $sesdir && -w $sesdir) {
      $sessionsdir = $sesdir;
    }
  }
  unless ($sessionsdir) {
    my $self = { org => 'Unknown yet', service => 'Unknown yet', };
    bless $self, 'Tequila::Client';
    my $tried = join (', ', @tried);
    $self->error ("Unable to find the Session directory XXX1, (tried $tried).");
  }
  unless ($localserver) {
    my $hostname = `hostname`;
    chomp $hostname;
    if ($hostname !~ /\./) {
      my  $addr = gethostbyname ($hostname);
      $hostname = gethostbyaddr ($addr, AF_INET);
    }
    my $localdomain = $1 if ($hostname =~ /^[^\.]*\.(.*)$/);
    unless ($localserver) {
      $localserver  = "tequila";
      $localserver .= ".$localdomain" if $localdomain;
    }
  }
  unless ($serverurl) {
    $serverurl  = "https://$localserver/tequila";
  }
  $defaultserver      = $localserver;
  $defaultsessionsdir = $sessionsdir;
  $defaultserverurl   = $serverurl;
}

sub escapeurl {
  local ($_) = @_;
  s/([^\w\+\.\-])/sprintf("%%%X",ord($1))/ge;
  return $_;
}

sub getrandombytes {
  my ($self, $len) = @_;
  $len ||= 32;
  my $bytes;
  open(RAND, "/dev/urandom") || do {
    $self->error ("Internal error in getrandombytes : ".
                  "unable to init random engine : $!.")
  };
  if (sysread (RAND, $bytes, $len) != $len) {
    $self->error ("Internal error in getrandombytes : ".
                  "Unable to read random bytes : $!");
  }
  close (RAND);
  return $bytes;
}

sub genkey {
  my ($self, $len) = @_;
  $len ||= 32;
  my $bytes = $self->getrandombytes ($len);
  my @bytes = unpack ("C$len", $bytes);
  my   $key = '';
  for (my $i = 0; $i < $len; $i++) {
    my $car = $bytes [$i] % 36;
    $key .= ('a'..'z', '0'..'9')[$car];
  }
  return $key;
}

sub httpsocket {
  my ($self, $url, $method, $args) = @_;
  my $sock;
  my $nredir = 0;
  while ($url) {
    $self->error ("Tequila:httpsocket: invalid URL : $url")
      if ($url !~ m!^(http|https)://([^/]*)(.*)$!);
    my ($prot, $host, $file, $port) = ($1, $2, $3, 0);
    ($host, $port) = split (/:/, $host) if ($host =~ /:/);
    unless ($port) {
      $port = ($prot eq 'https') ? 443 : 80;
    }
    $sock = ($prot eq 'https')
      ? $self->sslsocket ($host, $port)
      : new IO::Socket::INET ("$host:$port");
    $self->error ("Tequila:httpsocket: unable to open $prot socket connection to $host (for $url)")
      unless $sock;

    if ($method eq 'POST') {
      my $argstring = '';
      foreach my $arg (keys %$args) {
        $argstring .= "$arg=$args->{$arg}\n";
      }
      my $arglen = length ($argstring);
      print $sock "POST $file HTTP/1.0\r\n",
                  "Host: $host\r\n",
                  "Content-type: application/x-www-form-urlencoded\r\n",
                  "Content-length: $arglen\r\n",
                  "\r\n",
                  "$argstring" ||
        $self->error ("Tequila:httpsocket: unable to send data to $host:$port");
    } else {
      my $argstring = '';
      foreach my $arg (keys %$args) {
        $argstring .= "&$arg=$args->{$arg}";
      }
      $argstring =~ s/^&//;
      print $sock "GET $file?$argstring HTTP/1.0\r\n",
                  "Host: $host\r\n",
                  "\r\n" ||
        $self->error ("Tequila:httpsocket: unable to send data to $host:$port");
    }
    $url = 0;
    my $statusline = <$sock>;
    $statusline = <$sock> unless $statusline;
    $statusline =~ s/[\r\n]//g;
    return (452, $sock, "No answer from server") unless $statusline;
    my ($status) = ($statusline =~ / (\d*) /); # HTTP/1.x 200 OK
    while (<$sock>) { # headers
      last unless $_;
      s/^[\r\n]*$//;
      if (/^Location:\s*(.*)$/) {
        $url = $1;
      }
      last if /^$/;
    }
    if (($status != 200) && !$url) {
      return ($status, $sock, $statusline);
    }
    if ($url) {
      close ($sock);
      $nredir++;
      $self->error ("Tequila:httpsocket: maximun number of HTTP redirect : $nredir")
        if ($nredir > 20);
    }
  }
  return (200, $sock);
}

sub sslsocket {
  my ($self, $server, $port) = @_;
  $port = 'https' unless $port;
  my ($sock, %sslargs);
  $sslargs {PeerAddr} = "$server:$port";
  if ($self->{checkcertificates} && $self->{cafile}) {
    $sslargs {SSL_verify_mode} = 0x01;
    $sslargs {SSL_ca_file}     = $self->{cafile};
  }
  if ($self->{keyfile} && $self->{certfile}) {
    $sslargs {SSL_use_cert}  = 1;
    $sslargs {SSL_key_file}  = $self->{keyfile};
    $sslargs {SSL_cert_file} = $self->{certfile};
  }
  $sslargs {SSL_fingerprint} = $ENV {TEQUILA_FINGERPRINT} if $ENV {TEQUILA_FINGERPRINT} && $ENV {TEQUILA_FINGERPRINT} ne '';
  $sock = new IO::Socket::SSL (%sslargs);

  if ($self->{checkcertificates} && $self->{cafile}) {
    my $subject = $sock->peer_certificate ('subject');
    my @cns = split (/\/CN=/i, $subject);
    shift @cns;
    my $ok = 0;
    foreach my $cn (@cns) {
      if ($cn =~ /^\((.*)\)(.*)$/) {
        my $domain = $2;
        my @names = split (/\|/, $1);
        foreach my $name (@names) {
          my $fdqn = $name . $domain;
          if (uc $server eq uc $fdqn) { $ok = 1; last; }
        }
        last if $ok;
      } else {
        if (uc $server eq uc $cn) { $ok = 1; last; }
      }
      $self->error ("Tequila:sslsocket: invalid certificate for $server : $subject") unless $ok;
    }
  }
  return $sock;
}

sub checksessionkey {
  my ($self, $sessionkey) = @_;
  unless ($sessionkey =~ /^[a-z0-9]+$/i) {
    $sessionkey = fixmsg ($sessionkey);
    $self->error ("Tequila: Malformed session key : $sessionkey");
  }
}

sub fixmsg {
  my $msg = shift;
  $msg =~ s/</&lt;/g;
  $msg =~ s/>/&gt;/g;
  return $msg;
}


1;
