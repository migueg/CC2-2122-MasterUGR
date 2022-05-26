
if [ $1 = "install" ]; then
    echo "/-------------------------------------------------------/"
    echo "CLONING REPOSITORY..."
    echo "/-------------------------------------------------------/"
    git clone https://github.com/migueg/CC2-2122-MasterUGR.git
    cd CC2-2122-MasterUGR/P2
    echo "/-------------------------------------------------------/"
    echo "INSTALLING ARKADE..."
    echo "/-------------------------------------------------------/"
    curl -sLS https://get.arkade.dev | sudo sh
    echo "/-------------------------------------------------------/"
    echo "INSTALLING KIND..."
    echo "/-------------------------------------------------------/"
    arkade get kind
    echo "/-------------------------------------------------------/"
    echo "INSTALLING KUBECTL..."
    echo "/-------------------------------------------------------/"
    arkade get kubectl
    echo "/-------------------------------------------------------/"
    echo "INSTALLING FAAS-CLI..."
    echo "/-------------------------------------------------------/"
    arkade get faas-cli
    echo "/-------------------------------------------------------/"
    echo "CREATING CLUSTER..."
    echo "/-------------------------------------------------------/"
    ./kind-with-registry.sh
    echo "/-------------------------------------------------------/"
    echo "INSTALLING OPENFAAS..."
    echo "/-------------------------------------------------------/"
    arkade install openfaas
    echo "/-------------------------------------------------------/"
    echo "FINAL CLUSTER..." 
    echo "/-------------------------------------------------------/"
    kubectl get pods -n kube-system
    echo "/-------------------------------------------------------/"
    
fi;

if [ $1 = "deploy" ]; then
    echo "/-------------------------------------------------------/"
    echo "CRETING GATEWAY..."
    echo "/-------------------------------------------------------/"
    kubectl port-forward -n openfaas svc/gateway 8080:8080 &
    echo "/-------------------------------------------------------/"
    echo "PULLING IMAGE AND BUILDING FUNCTION..." 
    echo "/-------------------------------------------------------/"
    faas-cli build -f facerecognition.yml
    echo "/-------------------------------------------------------/"
    echo "DEPLOYING FUNCTION..." 
    echo "/-------------------------------------------------------/"
    faas-cli deploy -f facerecognition.yml
    echo "/-------------------------------------------------------/"
fi;


