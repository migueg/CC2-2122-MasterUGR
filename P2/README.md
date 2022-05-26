# Práctica 2

En esta práctica se ha realizado el desarrollo de una función para el reconocimiento facial a partir de una imagen, la cual ha sido desarrollada en node y ha sido desplegada en la plataforma faas **OpenFaas**. A continuación, se detallará el procedimiento llevado a cabo ara desarrollo

## Configuración e instalación de OpenFaas

La instalación y configuración de OpenFaas no es tan sencilla, ya que esta plataforma requiere de un cluster de Kubernetes para su funcionamiento y por lo tanto de todas las dependencias que conlleva esto, además de la instalación de la propia plataforma en nuestro entorno.  
Una de las principales dependencias es **Docker**, sin está Kubernetes será inútil y por consiguiente nuestra OpenFaas.Por lo tanto el primer paso a realizar será instalar **Docker** en nuestra máquina

Debido a que la configuración e instalación puede llegar a ser un proceso tedioso, OpenFaas proporciona un gestor de paquetes para instalar las herramientas que se requieren para el funcionamiento de la plataforma llamado **Arkade**. Por lo tanto, se ha utilizado esta herramienta con motivo de lograr una instalación y configuración más sencilla, es por eso que el primer paso ha realizar es instalar Arkade con el siguiente comando:

```
$ curl -sLS https://get.arkade.dev | sudo sh
```

![arkade](/img/arkade.png)

Una vez instalado Arkade comenzaremos a instalar Kubernetes, en concreto instalaremos **kind** y el gestor de línea de comandos para Kubernetes **kubectl** con los siguientes comandos:

```
$ arkade get kind
$ arkade get kubectl
```

![kind](/img/kind.png)
![kubectl](/img/kubectl.png)

A continuación, instalaremos el cliente de OpenFaas **faas-cli** que será necesario para la construcción y despliegue de la función desarrollada. Esto se realizará con el siguiente comando

```
$ arkade get faas-cli
```

![faas-cli](/img/faas-cli.png)


Llegados a este punto, necesitaremos crear un clúster de Kubernetes que admita registros locales de Docker, para ello kind nos ofrece un script en su sitio web, el cual puede consultarse [aquí](kind-with-registry.sh).Aunque finalmente, no se va a utilizar el registro local, sino que se va a usar Docker hub, el script es útil ya que nos crea el cluster de kubernetes que nos hace falta. Por lo tanto, lo único que habrá que realizar es ejecutar el script.

![cluster](/img/registryScript4.png)

Ya que tenemos que tenemos nuestro clúster creado, podemos instalar OpenFaas con el siguiente comando

```
$ arkade install openfaas
```

![install](/img/installOpenfaas.png)

Esta orden nos ha instalado directamente openfaas en el clúster creado pudiendo observar por línea de comandos

![install](/img/installOpenfaas2.png)

Atendiendo a la anterior imagen de los pods desplegados hay que prestar especial atención al gateway, el cuál nos permitirá interaccionar con OpenFaas y tanto desplegar nuestras funciones en el cluster como realizar llamadas a las funciones. Por lo tanto, deberemos conectar el servicion gateway con el exterior. Para ello, primero consultaremos los servicios que nos proporciona OpenFaas con el siguiente comandos

```
$ kubectl get svc -n openfaas
```
![install](/img/svcs.png)

Podemos observar que el gateway está utilizando el puerto 8080 del clúster, por lo que las peticiones que lleguen a mi máquina a ese puerto las redirigiremos a ese puerto del clúster con el sioguiente comando:


```
$ kubectl port-forward -n openfaas svc/gateway 8080:8080
```
![install](/img/forward.png)

Esto hará que las peticiones que entren en mi máquina por el puerto 8080 vayan a ser atendidas directamente por la aplicación de openfaas de mis clúster de kubernetes.

Ya tenemos funcionando OpenFaas en nuestra máquina, por lo que el siguiente paso será hacer login en la plataforma a la dirección *http://localhost:8080*

![first](/img/login.png)

Sin embargo, como observamos en la imágen superior, la primera vez que accedemos nos pide un usuario y una contraseña. Para averiguar la contraseña, la extraeremos por medio de kubectl con la siguiente orden


```
$ kubectl get secret -n openfaas basic-auth -o json
```
![first](/img/passAuth.png)

El campo *basic-auth-password* nos indica la contraseña codificada en base 64, por lo que lo que la decoficaremos a texto plano, al igual que el usuario. Una vez conocidos usuarios y contraseñas para no tener que hacer login mas veces usarmos el siguiente comando:

```
$ echo "pass" | faas-cli login -s
```
![first](/img/savingCredentials.png)

Una vex guardadas las credenciales, ya podremos acceder a openfaas y desplegar nuestras fucniones.

![first](/img/openfaasFirstAccess.png)


## Implementación de la función

Para la implementación de las funciones OpenFaas nos proporciona templates para usar como referencia en el desarrollo y solo centrarnos en el desarrollo de la función en sí. En este caso, la función se ha desarrollado en node16 y es por eso que partí desde ese template. El cliente de línea de comandos de openfaas proporciona un comando para generar el template, es por eso que en primer lugar ejecutaremos ese comando


```
$ faas-cli template store pull node16
```

Esta línea nos descargará el template y nos creará una carpeta que contendrá el template, en base al cual podremos empezar a construir la función:


![img](/img/template.png)

Una vez descargado el template crearemos la función con el cliente de openfaas en base a ese template, el cual nos generará lo necesario con el siguiente comando:

```
$ faas-cli new facerecognition --lang node16
```

A partir de aquí ya podremos a empezar a meternos en el código de la función. Para conseguir el reconocimiento fancial en node, he necesitado de dos dependencias:

+ face-api: Una libreria para el reconocimiento facial para javascript
+ canvas: Me va a permitir crear elementos canva necesarios para trabajar con la librería de reconocimiento facial

Por lo tanto ambas dependencias se tienen que añadir en el [package.json](/facerecognition/package.json) de la función:

![img](/img/dep.png)


El código de la función hará lo siguiente:

1. Recibirá una URL donde se encuentra la imagen y detectará si es un formato permitido
2. Si es así, la descargará y la guardará en un directorio temporal, utilizando un timestamp de nombre (método downloadImage)

![img](/img/downloadImg.png)

3. Cuando ha terminado, se cargan los modelos de reconocimiento facial en la librería los cuales se encuentran [aquí](/facerecognition/models) y han sido obtenidos de los repositorios de la misma librería

![img](/img/loadModels.png)

4. Ya cargados los modelos, se empieza con la detección:
  - Primero se carga la imagen en memoria
  - Se detectan las caras en la imagen cargada en memoria. Las detecciones se alamcenan en un objeto
  - Se crea un canva y se rellena con la imagen sin detecciones
  - Se dibujan las detecciones en el canva con la imagen
  - Se renderiza el canva a un buffer de bytes


  ![img](/img/start.png)

5. El buffer con la imagen lo devolvemos en la respuesta estableciendo la cabecera a imagen para que se la respuesta se interprete como imagen

  ![img](/img/res.png)

## Despliegue de la función

Una vez implementada la función, el siguiente paso será desplegarla en openfaas. Para ello habra que configurar el fichero yml de configuración de despliegue de la función llamado [facerecognition.yml](/facerecognition/facerecognition.yml)  
En este fichero estableceremos:
1. El gateway que en nuestro caso se encuentra en *http://127.0.0.1:8080*
2. El lenguaje utilizado, que utilizará el template para ese lenguaje
3. El nombre de la imagen que se utilizará para albergar a la función
4. Tiempos de timeout. Se establecerán a 2 minutos debido a que por defecto son muy pequeños y esta función requiere de más tiempo de procesamiento

  ![img](/img/yml.png)

Antes de construir la función habrá que realizar unas modificaciones en el dockerfile del template ya que se requieren de varias dependencias que requieren las librerias utilizadas que no contiene la imagen que viene por defecto, en concreto se tratan de estas:
  ![img](/img/extradeps.png)

Ya configurado el fichero de despliegue y el dockerfile, lo primero será construir la función con el siguiente comando:

```
$ faas-cli build -f facerecognition.yml
```

  ![img](/img/build.png)

El siguiente paso será pushear la imagen generada al registro de docker hub, para que openfaas pueda hacer un pull de esta cuando la función sea desplegada. Esto se realiza con el comando:
  ```
  $ faas-cli push -f facerecognition.yml
  ```

Subida la imagen, el último paso será desplegar la función en el cluster, con:

```
$ faas-cli deploy -f facerecognition.yml
```

  ![img](/img/deploy.png)

Una vez desplegada ya veremos nuestra función en la interfaz y podremos hacer uso de ella

  ![img](/img/ready.png)

Sin embargo, el resultado no se apreciará mediante la interfaz de OpenFaas ya que no es capaz de renderizar la imagen de vuelt, pero si utilizamos otro programa como **Postman** para invocar a la función pasándole la siguiente imagen de ejemplo

![img](https://cdn.picpng.com/faces/faces-background-32775.png)

obtendremos el siguiente resultado:

![img](/img/result.png)
